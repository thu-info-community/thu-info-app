#import "RTNPasskey.h"

#import <CommonCrypto/CommonDigest.h>
#import <LocalAuthentication/LocalAuthentication.h>
#import <Security/Security.h>
#import <TargetConditionals.h>
#import <UIKit/UIKit.h>
#include <atomic>
#include <cmath>

static NSString *const PKService = @"thuinfo.passkey.metadata";
static NSString *const PKPrefix = @"thuinfo.passkey.";
static NSString *const PKErrorDomain = @"RTNPasskey";
static NSString *const PKRPID = @"tsinghua.edu.cn";
static NSString *const PKOrigin = @"https://id.tsinghua.edu.cn";

static NSError *PKFailure(NSString *code)
{
  return [NSError errorWithDomain:PKErrorDomain code:0 userInfo:@{NSLocalizedDescriptionKey: code}];
}

static NSError *PKPlatformFailure(NSError *error)
{
  // Return only stable bridge codes; never expose identifiers or system diagnostics.
  NSError *root = error;
  for (NSUInteger depth = 0; error && depth < 4; depth++) {
    if ([error.domain isEqualToString:LAErrorDomain]) {
      switch (error.code) {
        case LAErrorUserCancel:
        case LAErrorAppCancel:
        case LAErrorSystemCancel:
        case LAErrorUserFallback:
          return PKFailure(@"PASSKEY_CANCELED");
        case LAErrorNotInteractive:
          return PKFailure(@"PASSKEY_INTERACTION_REQUIRED");
        case LAErrorPasscodeNotSet:
        case LAErrorBiometryNotAvailable:
        case LAErrorBiometryNotEnrolled:
        case LAErrorBiometryLockout:
        case LAErrorAuthenticationFailed:
          return PKFailure(@"PASSKEY_AUTH_UNAVAILABLE");
      }
    }
    error = error.userInfo[NSUnderlyingErrorKey];
  }
  // A Security error may wrap LAErrorUserCancel; inspect that before mapping
  // the outer errSecAuthFailed so a canceled prompt stays a canceled login.
  error = root;
  for (NSUInteger depth = 0; error && depth < 4; depth++) {
    if ([error.domain isEqualToString:NSOSStatusErrorDomain]) {
      switch (error.code) {
        case errSecUserCanceled:
          return PKFailure(@"PASSKEY_CANCELED");
        case errSecInteractionNotAllowed:
          return PKFailure(@"PASSKEY_INTERACTION_REQUIRED");
        case errSecAuthFailed:
          return PKFailure(@"PASSKEY_AUTH_UNAVAILABLE");
        case errSecItemNotFound:
        case errSecDecode:
          return PKFailure(@"PASSKEY_KEY_INVALIDATED");
      }
    }
    error = error.userInfo[NSUnderlyingErrorKey];
  }
  return PKFailure(@"PASSKEY_UNAVAILABLE");
}

static NSError *PKStatusFailure(OSStatus status)
{
  return PKPlatformFailure([NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil]);
}

static NSString *PKEncode(NSData *data)
{
  NSString *result = [data base64EncodedStringWithOptions:0];
  result = [result stringByReplacingOccurrencesOfString:@"+" withString:@"-"];
  result = [result stringByReplacingOccurrencesOfString:@"/" withString:@"_"];
  return [result stringByReplacingOccurrencesOfString:@"=" withString:@""];
}

static NSData *PKHash(NSData *data)
{
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(data.bytes, (CC_LONG)data.length, digest);
  return [NSData dataWithBytes:digest length:sizeof(digest)];
}

static NSString *PKJSON(id value, NSError **error)
{
  NSData *data = [NSJSONSerialization dataWithJSONObject:value options:0 error:nil];
  if (!data) {
    *error = PKFailure(@"PASSKEY_UNAVAILABLE");
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

static BOOL PKValidKeyID(NSString *keyID)
{
  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:keyID];
  return uuid && [uuid.UUIDString caseInsensitiveCompare:keyID] == NSOrderedSame;
}

static NSMutableDictionary *PKKeyQuery(NSString *keyID)
{
  return [@{
    (__bridge id)kSecClass: (__bridge id)kSecClassKey,
    (__bridge id)kSecAttrKeyType: (__bridge id)kSecAttrKeyTypeECSECPrimeRandom,
    (__bridge id)kSecAttrKeyClass: (__bridge id)kSecAttrKeyClassPrivate,
    (__bridge id)kSecAttrApplicationTag: [[PKPrefix stringByAppendingString:keyID] dataUsingEncoding:NSUTF8StringEncoding],
  } mutableCopy];
}

static NSMutableDictionary *PKMetadataQuery(NSString *keyID)
{
  return [@{
    (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService: PKService,
    (__bridge id)kSecAttrAccount: keyID,
    (__bridge id)kSecAttrSynchronizable: @NO,
  } mutableCopy];
}

@implementation RTNPasskey {
  dispatch_queue_t _worker;
  std::atomic<uint64_t> _generation;
  std::atomic<bool> _closed;
  LAContext *_activeContext;
}

RCT_EXPORT_MODULE(RTNPasskey)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _worker = dispatch_queue_create("thuinfo.passkey", DISPATCH_QUEUE_SERIAL);
    _generation.store(0);
    _closed.store(false);
    NSNotificationCenter *notifications = NSNotificationCenter.defaultCenter;
    [notifications addObserver:self selector:@selector(cancelForLifecycle:)
                         name:UIApplicationDidEnterBackgroundNotification object:nil];
    [notifications addObserver:self selector:@selector(cancelForLifecycle:)
                         name:UIApplicationProtectedDataWillBecomeUnavailable object:nil];
  }
  return self;
}

- (void)cancelForLifecycle:(NSNotification *)notification
{
  // Authentication UI can make the app inactive. Only backgrounding / device
  // locking cancels the operation; UIApplicationWillResignActive would cancel Face ID.
  LAContext *context;
  @synchronized (self) {
    _generation.fetch_add(1);
    context = _activeContext;
  }
  [context invalidate];
}

- (void)invalidate
{
  _closed.store(true);
  [NSNotificationCenter.defaultCenter removeObserver:self];
  [self cancelForLifecycle:nil];
}

- (void)dealloc
{
  [NSNotificationCenter.defaultCenter removeObserver:self];
  [_activeContext invalidate];
}

- (BOOL)ensureUnlocked:(NSError **)error
{
  if (_closed.load()) {
    *error = PKFailure(@"PASSKEY_CANCELED");
    return NO;
  }
  __block BOOL unlocked;
  void (^readState)(void) = ^{ unlocked = UIApplication.sharedApplication.protectedDataAvailable; };
  if (NSThread.isMainThread) readState();
  else dispatch_sync(dispatch_get_main_queue(), readState);
  if (!unlocked) *error = PKFailure(@"PASSKEY_LOCKED");
  return unlocked;
}

- (BOOL)ensureForeground:(NSError **)error
{
  __block BOOL foreground;
  void (^readState)(void) = ^{ foreground = UIApplication.sharedApplication.applicationState == UIApplicationStateActive; };
  if (NSThread.isMainThread) readState();
  else dispatch_sync(dispatch_get_main_queue(), readState);
  if (!foreground) *error = PKFailure(@"PASSKEY_INTERACTION_REQUIRED");
  return foreground;
}

- (BOOL)ensureGeneration:(uint64_t)generation error:(NSError **)error
{
  if (![self ensureUnlocked:error]) return NO;
  if (_generation.load() != generation) {
    *error = PKFailure(@"PASSKEY_CANCELED");
    return NO;
  }
  return YES;
}

- (NSString *)verificationAvailability
{
  LAContext *context = [LAContext new];
  NSError *error = nil;
  BOOL available = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:&error];
  [context invalidate];
  if (available) return @"available";
  if ([error.domain isEqualToString:LAErrorDomain] && error.code == LAErrorPasscodeNotSet) return @"not-configured";
  return @"unknown";
}

- (void)perform:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
         action:(id (^)(NSError **))action
{
  // Keep creation, counters, deletion and authorization prompts strictly serial.
  dispatch_async(_worker, ^{
    @autoreleasepool {
      NSError *error = nil;
      id value = nil;
      @try {
        if (self->_closed.load()) error = PKFailure(@"PASSKEY_CANCELED");
        else value = action(&error);
      } @catch (NSException *exception) {
        error = PKFailure(@"PASSKEY_UNAVAILABLE");
      }
      if (error) reject(error.localizedDescription, error.localizedDescription, nil);
      else resolve(value);
    }
  });
}

- (NSMutableDictionary *)readMetadata:(NSString *)keyID error:(NSError **)error
{
  if (!PKValidKeyID(keyID)) {
    *error = PKFailure(@"PASSKEY_KEY_INVALIDATED");
    return nil;
  }
  if (![self ensureUnlocked:error]) return nil;
  NSMutableDictionary *query = PKMetadataQuery(keyID);
  query[(__bridge id)kSecReturnData] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;
  CFTypeRef value = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &value);
  NSData *data = CFBridgingRelease(value);
  if (status == errSecItemNotFound) return nil;
  if (status != errSecSuccess) {
    *error = PKStatusFailure(status);
    return nil;
  }
  id parsed = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil];
  if (![parsed isKindOfClass:NSMutableDictionary.class]) {
    *error = PKFailure(@"PASSKEY_KEY_INVALIDATED");
    return nil;
  }
  NSMutableDictionary *metadata = parsed;
  for (NSString *field in @[@"keyId", @"credentialId", @"publicKeyX", @"publicKeyY", @"protectionLevel", @"authenticationMode"]) {
    if (![metadata[field] isKindOfClass:NSString.class]) {
      *error = PKFailure(@"PASSKEY_KEY_INVALIDATED");
      return nil;
    }
  }
  NSNumber *counter = metadata[@"counter"];
  if (![metadata[@"keyId"] isEqualToString:keyID] ||
      ![@[@"required", @"silent"] containsObject:metadata[@"authenticationMode"]] ||
      ![counter isKindOfClass:NSNumber.class] || counter.doubleValue < 0 ||
      counter.doubleValue > UINT32_MAX || std::floor(counter.doubleValue) != counter.doubleValue) {
    *error = PKFailure(@"PASSKEY_KEY_INVALIDATED");
    return nil;
  }
  // Inspect existence without retrieving a usable private key or presenting UI.
  query = PKKeyQuery(keyID);
  LAContext *context = [LAContext new];
  context.interactionNotAllowed = YES;
  query[(__bridge id)kSecUseAuthenticationContext] = context;
  query[(__bridge id)kSecReturnAttributes] = @YES;
  value = NULL;
  status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &value);
  if (value) CFRelease(value);
  [context invalidate];
  if (status == errSecItemNotFound) return nil;
  // Some OS versions enforce ACLs even for an attributes-only query. The key
  // exists, but authorizing its use belongs to signAssertion, never this getter.
  if (status != errSecSuccess && status != errSecInteractionNotAllowed) {
    *error = PKStatusFailure(status);
    return nil;
  }
  return metadata;
}

- (BOOL)saveMetadata:(NSDictionary *)metadata create:(BOOL)create error:(NSError **)error
{
  NSData *data = [NSJSONSerialization dataWithJSONObject:metadata options:0 error:nil];
  if (!data) {
    *error = PKFailure(@"PASSKEY_UNAVAILABLE");
    return NO;
  }
  NSMutableDictionary *query = PKMetadataQuery(metadata[@"keyId"]);
  OSStatus status;
  if (create) {
    query[(__bridge id)kSecValueData] = data;
    query[(__bridge id)kSecAttrAccessible] = [metadata[@"authenticationMode"] isEqualToString:@"required"] ?
      (__bridge id)kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly : (__bridge id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly;
    status = SecItemAdd((__bridge CFDictionaryRef)query, NULL);
  } else {
    // Updating only data preserves the original accessibility / mode policy.
    status = SecItemUpdate((__bridge CFDictionaryRef)query, (__bridge CFDictionaryRef)@{(__bridge id)kSecValueData: data});
  }
  if (status != errSecSuccess) *error = PKStatusFailure(status);
  return status == errSecSuccess;
}

- (BOOL)deleteLocalCredential:(NSString *)keyID error:(NSError **)error
{
  if (!PKValidKeyID(keyID)) {
    *error = PKFailure(@"PASSKEY_KEY_INVALIDATED");
    return NO;
  }
  // Exact UUID tags only. A device name is never used to find or delete keys.
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)PKKeyQuery(keyID));
  if (status != errSecSuccess && status != errSecItemNotFound) {
    *error = PKStatusFailure(status);
    return NO;
  }
  status = SecItemDelete((__bridge CFDictionaryRef)PKMetadataQuery(keyID));
  if (status != errSecSuccess && status != errSecItemNotFound) *error = PKStatusFailure(status);
  return status == errSecSuccess || status == errSecItemNotFound;
}

- (id)generatePrivateKey:(NSString *)keyID mode:(NSString *)mode hardware:(BOOL)hardware error:(NSError **)error
{
  BOOL required = [mode isEqualToString:@"required"];
  SecAccessControlCreateFlags flags = hardware ? kSecAccessControlPrivateKeyUsage : (SecAccessControlCreateFlags)0;
  if (required) flags |= kSecAccessControlUserPresence;
  CFErrorRef failure = NULL;
  SecAccessControlRef access = SecAccessControlCreateWithFlags(kCFAllocatorDefault,
    required ? kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly : kSecAttrAccessibleWhenUnlockedThisDeviceOnly, flags, &failure);
  if (!access) {
    *error = CFBridgingRelease(failure);
    return nil;
  }
  // privateKeyUsage is valid only for Secure Enclave keys. Software fallback
  // instead requires userPresence when the key is retrieved from the Keychain.
  NSMutableDictionary *attributes = [@{
    (__bridge id)kSecAttrKeyType: (__bridge id)kSecAttrKeyTypeECSECPrimeRandom,
    (__bridge id)kSecAttrKeySizeInBits: @256,
    (__bridge id)kSecPrivateKeyAttrs: @{
      (__bridge id)kSecAttrIsPermanent: @YES,
      (__bridge id)kSecAttrApplicationTag: [[PKPrefix stringByAppendingString:keyID] dataUsingEncoding:NSUTF8StringEncoding],
      (__bridge id)kSecAttrAccessControl: (__bridge id)access,
    },
  } mutableCopy];
  if (hardware) attributes[(__bridge id)kSecAttrTokenID] = (__bridge id)kSecAttrTokenIDSecureEnclave;
  id key = CFBridgingRelease(SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, &failure));
  CFRelease(access);
  if (!key) *error = CFBridgingRelease(failure);
  return key;
}

- (void)getCapabilities:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [self perform:resolve reject:reject action:^id(NSError **error) {
    return PKJSON(@{@"available": @YES, @"verificationAvailability": [self verificationAvailability]}, error);
  }];
}

- (void)createCredential:(NSString *)mode resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [self perform:resolve reject:reject action:^id(NSError **error) {
    if (![@[@"required", @"silent"] containsObject:mode]) {
      *error = PKFailure(@"PASSKEY_UNAVAILABLE");
      return nil;
    }
    uint64_t generation = self->_generation.load();
    if (![self ensureUnlocked:error]) return nil;
    if ([mode isEqualToString:@"required"]) {
      if (![self ensureForeground:error]) return nil;
      if (![[self verificationAvailability] isEqualToString:@"available"]) {
        *error = PKFailure(@"PASSKEY_AUTH_UNAVAILABLE");
        return nil;
      }
    }
    NSString *keyID = NSUUID.UUID.UUIDString;
    // The simulator has no Secure Enclave. On physical devices, fallback is
    // permitted only for the explicit unsupported-operation status, not an
    // authentication, entitlement, lock, or generic availability failure.
    BOOL hardware = !TARGET_OS_SIMULATOR;
    NSError *failure = nil;
    id privateKey = [self generatePrivateKey:keyID mode:mode hardware:hardware error:&failure];
    if (!privateKey && hardware && [failure.domain isEqualToString:NSOSStatusErrorDomain] && failure.code == errSecUnimplemented) {
      NSError *cleanupError = nil;
      if (![self deleteLocalCredential:keyID error:&cleanupError]) {
        *error = cleanupError;
        return nil;
      }
      hardware = NO;
      failure = nil;
      privateKey = [self generatePrivateKey:keyID mode:mode hardware:NO error:&failure];
    }
    if (!privateKey) {
      *error = PKPlatformFailure(failure);
      NSError *cleanupError = nil;
      [self deleteLocalCredential:keyID error:&cleanupError];
      return nil;
    }
    BOOL saved = NO;
    @try {
      id publicKey = CFBridgingRelease(SecKeyCopyPublicKey((__bridge SecKeyRef)privateKey));
      CFErrorRef exportError = NULL;
      NSData *point = publicKey ? CFBridgingRelease(SecKeyCopyExternalRepresentation((__bridge SecKeyRef)publicKey, &exportError)) : nil;
      if (exportError) CFRelease(exportError);
      unsigned char credential[32];
      if (point.length != 65 || ((const unsigned char *)point.bytes)[0] != 0x04 ||
          SecRandomCopyBytes(kSecRandomDefault, sizeof(credential), credential) != errSecSuccess) {
        *error = PKFailure(@"PASSKEY_UNAVAILABLE");
        return nil;
      }
      NSMutableDictionary *metadata = [@{
        @"keyId": keyID,
        @"credentialId": PKEncode([NSData dataWithBytes:credential length:sizeof(credential)]),
        @"publicKeyX": PKEncode([point subdataWithRange:NSMakeRange(1, 32)]),
        @"publicKeyY": PKEncode([point subdataWithRange:NSMakeRange(33, 32)]),
        @"protectionLevel": hardware ? @"hardware" : @"software",
        @"authenticationMode": mode,
        @"counter": @0,
      } mutableCopy];
      if (![self saveMetadata:metadata create:YES error:error] || ![self ensureGeneration:generation error:error]) return nil;
      NSString *result = PKJSON(metadata, error);
      saved = result != nil;
      return result;
    } @finally {
      if (!saved) {
        NSError *cleanupError = nil;
        [self deleteLocalCredential:keyID error:&cleanupError];
      }
    }
  }];
}

- (void)getCredential:(NSString *)keyID resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [self perform:resolve reject:reject action:^id(NSError **error) {
    NSDictionary *metadata = [self readMetadata:keyID error:error];
    return metadata ? PKJSON(metadata, error) : @"null";
  }];
}

- (void)signAssertion:(NSString *)keyID challenge:(NSString *)challenge
              resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [self perform:resolve reject:reject action:^id(NSError **error) {
    uint64_t generation = self->_generation.load();
    if (![self ensureUnlocked:error]) return nil;
    NSCharacterSet *invalid = [[NSCharacterSet characterSetWithCharactersInString:
      @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"] invertedSet];
    if (challenge.length < 16 || challenge.length > 1024 || [challenge rangeOfCharacterFromSet:invalid].location != NSNotFound) {
      *error = PKFailure(@"PASSKEY_UNAVAILABLE");
      return nil;
    }
    NSMutableDictionary *metadata = [self readMetadata:keyID error:error];
    if (!metadata) {
      if (!*error) *error = PKFailure(@"PASSKEY_KEY_INVALIDATED");
      return nil;
    }
    BOOL required = [metadata[@"authenticationMode"] isEqualToString:@"required"];
    if (required) {
      if (![self ensureForeground:error]) return nil;
      if (![[self verificationAvailability] isEqualToString:@"available"]) {
        *error = PKFailure(@"PASSKEY_AUTH_UNAVAILABLE");
        return nil;
      }
    }
    uint64_t counter = [metadata[@"counter"] unsignedLongLongValue] + 1;
    if (counter > UINT32_MAX) {
      *error = PKFailure(@"PASSKEY_KEY_INVALIDATED");
      return nil;
    }
    metadata[@"counter"] = @(counter);
    // Persist before prompting / signing: failed attempts may leave gaps, but
    // a crash or cancellation must never reuse a previously issued counter.
    if (![self saveMetadata:metadata create:NO error:error]) return nil;
    NSData *client = [NSJSONSerialization dataWithJSONObject:@{
      @"type": @"webauthn.get", @"challenge": challenge, @"origin": PKOrigin, @"crossOrigin": @NO,
    } options:0 error:nil];
    if (!client) {
      *error = PKFailure(@"PASSKEY_UNAVAILABLE");
      return nil;
    }
    NSMutableData *authenticator = [PKHash([PKRPID dataUsingEncoding:NSUTF8StringEncoding]) mutableCopy];
    // The school's current validator requires UP and UV. Silent mode declares
    // these flags in software; it does not verify the user for each signature.
    const unsigned char suffix[] = {0x05, (unsigned char)(counter >> 24), (unsigned char)(counter >> 16),
      (unsigned char)(counter >> 8), (unsigned char)counter};
    [authenticator appendBytes:suffix length:sizeof(suffix)];
    NSMutableData *message = [authenticator mutableCopy];
    [message appendData:PKHash(client)];

    // Never cache this context or a private-key reference between assertions.
    // The key's ACL, rather than a separate JS authentication result, authorizes
    // Secure Enclave signing (or software Keychain key retrieval).
    LAContext *context = [LAContext new];
    context.touchIDAuthenticationAllowableReuseDuration = 0;
    context.interactionNotAllowed = !required;
    BOOL chinese = [NSLocale.preferredLanguages.firstObject hasPrefix:@"zh"];
    context.localizedReason = chinese ? @"验证后使用 Passkey 登录" : @"Verify to sign in with Passkey";
    context.localizedCancelTitle = chinese ? @"取消" : @"Cancel";
    @synchronized (self) {
      if (self->_closed.load() || self->_generation.load() != generation) {
        [context invalidate];
        *error = PKFailure(@"PASSKEY_CANCELED");
        return nil;
      }
      self->_activeContext = context;
    }
    @try {
      if (![self ensureGeneration:generation error:error]) return nil;
      if (required && ![self ensureForeground:error]) return nil;
      NSMutableDictionary *query = PKKeyQuery(keyID);
      query[(__bridge id)kSecReturnRef] = @YES;
      query[(__bridge id)kSecUseAuthenticationContext] = context;
      CFTypeRef value = NULL;
      OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &value);
      id privateKey = CFBridgingRelease(value);
      if (![self ensureGeneration:generation error:error]) return nil;
      if (status != errSecSuccess || !privateKey) {
        *error = PKStatusFailure(status);
        return nil;
      }
      if (!SecKeyIsAlgorithmSupported((__bridge SecKeyRef)privateKey, kSecKeyOperationTypeSign, kSecKeyAlgorithmECDSASignatureMessageX962SHA256)) {
        *error = PKFailure(@"PASSKEY_UNAVAILABLE");
        return nil;
      }
      CFErrorRef failure = NULL;
      NSData *signature = CFBridgingRelease(SecKeyCreateSignature((__bridge SecKeyRef)privateKey,
        kSecKeyAlgorithmECDSASignatureMessageX962SHA256, (__bridge CFDataRef)message, &failure));
      NSError *platformError = CFBridgingRelease(failure);
      if (![self ensureGeneration:generation error:error]) return nil;
      if (!signature) {
        *error = PKPlatformFailure(platformError);
        return nil;
      }
      return PKJSON(@{@"clientDataJSON": PKEncode(client), @"authenticatorData": PKEncode(authenticator),
        @"signature": PKEncode(signature)}, error);
    } @finally {
      @synchronized (self) {
        if (self->_activeContext == context) self->_activeContext = nil;
      }
      [context invalidate];
    }
  }];
}

- (void)deleteCredential:(NSString *)keyID resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [self perform:resolve reject:reject action:^id(NSError **error) {
    [self deleteLocalCredential:keyID error:error];
    return nil;
  }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePasskeySpecJSI>(params);
}

@end
