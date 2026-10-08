import { common } from '@kit.AbilityKit';
import { huks } from '@kit.UniversalKeystoreKit';
import { cryptoFramework } from '@kit.CryptoArchitectureKit';
import { util } from '@kit.ArkTS';
import { userAuth } from '@kit.UserAuthenticationKit';
import { BusinessError } from '@kit.BasicServicesKit';
import preferences from '@ohos.data.preferences';
import deviceInfo from '@ohos.deviceInfo';
import screenLock from '@ohos.screenLock';
import commonEventManager from '@ohos.commonEventManager';

const RP_ID = 'tsinghua.edu.cn';
const ORIGIN = 'https://id.tsinghua.edu.cn';
const PREFIX = 'thuinfo.passkey.';

export interface HuksPasskey {
  keyId: string;
  credentialId: string;
  publicKeyX: string;
  publicKeyY: string;
  publicKeyDer: string;
  protectionLevel: string;
  userAuthTypes: userAuth.UserAuthType[];
  authenticationMode: string;
}

export interface HuksAssertion {
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
}

export function encodePasskeyBytes(bytes: Uint8Array): string {
  return new util.Base64Helper().encodeToStringSync(bytes, util.Type.BASIC_URL_SAFE).replace(/=+$/, '');
}

export function decodePasskeyBytes(text: string): Uint8Array {
  return new util.Base64Helper().decodeSync(text, util.Type.BASIC_URL_SAFE);
}

function utf8(text: string): Uint8Array {
  return new util.TextEncoder().encodeInto(text);
}

function concatenate(first: Uint8Array, second: Uint8Array): Uint8Array {
  const result = new Uint8Array(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const digest = cryptoFramework.createMd('SHA256');
  await digest.update({data: bytes});
  return (await digest.digest()).data;
}

function coordinate(value: bigint): Uint8Array {
  const hex = value.toString(16).padStart(64, '0');
  if (hex.length !== 64) throw new Error('Invalid P-256 coordinate');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** HUKS owns private keys. The preferences contain only public metadata and counters. */
export class HuksPasskeyStore {
  private ready: Promise<void>;
  private metadata!: preferences.Preferences;
  private subscriber: commonEventManager.CommonEventSubscriber | undefined;
  private sessions: Set<number> = new Set<number>();
  private authentication: userAuth.UserAuthInstance | undefined;
  private lockGeneration: number = 0;
  private destroyed: boolean = false;
  private isForeground: () => boolean;

  constructor(context: common.UIAbilityContext, isForeground: () => boolean = (): boolean => true) {
    this.isForeground = isForeground;
    this.ready = this.initialize(context);
  }

  private async initialize(context: common.UIAbilityContext): Promise<void> {
    this.metadata = await preferences.getPreferences(context, {name: 'thuinfo_passkeys'});
    this.subscriber = await commonEventManager.createSubscriber({events: [
      commonEventManager.Support.COMMON_EVENT_SCREEN_LOCKED,
      commonEventManager.Support.COMMON_EVENT_SCREEN_OFF,
    ]});
    commonEventManager.subscribe(this.subscriber, (error: BusinessError) => {
      if (!error) {
        this.lockGeneration++;
        this.authentication?.cancel();
        this.abortSessions().catch(() => {});
      }
    });
  }

  async available(): Promise<boolean> {
    try {
      await this.ready;
      return !this.destroyed && canIUse('SystemCapability.Security.Huks.Core');
    } catch { return false; }
  }

  availableAuthenticationTypes(): userAuth.UserAuthType[] {
    const types: userAuth.UserAuthType[] = [];
    for (const type of [userAuth.UserAuthType.FACE, userAuth.UserAuthType.FINGERPRINT, userAuth.UserAuthType.PIN]) {
      try { userAuth.getAvailableStatus(type, userAuth.AuthTrustLevel.ATL3); types.push(type); }
      catch { /* Exclude methods absent, unenrolled, or below the required trust level. */ }
    }
    return types;
  }

  verificationAvailability(): string {
    if (this.availableAuthenticationTypes().length) return 'available';
    try { userAuth.getAvailableStatus(userAuth.UserAuthType.PIN, userAuth.AuthTrustLevel.ATL3); }
    catch (error) {
      const code = (error as BusinessError).code;
      if (code === 12500010) return 'not-configured';
      if (code === 12500005 || code === 12500006) return 'unsupported';
    }
    return 'unknown';
  }

  async ensureUnlocked(generation?: number): Promise<void> {
    await this.ready;
    if (this.destroyed || await screenLock.isScreenLocked() ||
      (generation !== undefined && generation !== this.lockGeneration)) {
      throw new Error('PASSKEY_LOCKED');
    }
  }

  private alias(keyId: string): string {
    if (!/^[0-9a-f]{32}$/.test(keyId)) throw new Error('Invalid Passkey key ID');
    return PREFIX + keyId;
  }

  location(): huks.HuksOptions {
    return {properties: [{
      tag: huks.HuksTag.HUKS_TAG_AUTH_STORAGE_LEVEL,
      value: huks.HuksAuthStorageLevel.HUKS_AUTH_STORAGE_LEVEL_ECE,
    }]};
  }

  signOptions(inData?: Uint8Array): huks.HuksOptions {
    const properties: huks.HuksParam[] = this.location().properties!;
    properties.push({tag: huks.HuksTag.HUKS_TAG_ALGORITHM, value: huks.HuksKeyAlg.HUKS_ALG_ECC});
    properties.push({tag: huks.HuksTag.HUKS_TAG_KEY_SIZE, value: huks.HuksKeySize.HUKS_ECC_KEY_SIZE_256});
    properties.push({tag: huks.HuksTag.HUKS_TAG_PURPOSE, value: huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_SIGN});
    properties.push({tag: huks.HuksTag.HUKS_TAG_DIGEST, value: huks.HuksKeyDigest.HUKS_DIGEST_SHA256});
    return {properties: properties, inData: inData};
  }

  private authenticationType(type: userAuth.UserAuthType): huks.HuksUserAuthType {
    if (type === userAuth.UserAuthType.PIN) return huks.HuksUserAuthType.HUKS_USER_AUTH_TYPE_PIN;
    if (type === userAuth.UserAuthType.FACE) return huks.HuksUserAuthType.HUKS_USER_AUTH_TYPE_FACE;
    if (type === userAuth.UserAuthType.FINGERPRINT) return huks.HuksUserAuthType.HUKS_USER_AUTH_TYPE_FINGERPRINT;
    throw new Error('Unsupported authentication type');
  }

  async createCredential(mode: string = 'required'): Promise<HuksPasskey> {
    if (mode !== 'required' && mode !== 'silent') throw new Error('Invalid authentication mode');
    await this.ensureUnlocked();
    if (mode === 'required' && !this.isForeground()) throw new Error('PASSKEY_INTERACTION_REQUIRED');
    const authTypes = mode === 'required' ? this.availableAuthenticationTypes() : [];
    if (mode === 'required' && !authTypes.length) throw new Error('PASSKEY_AUTH_UNAVAILABLE');
    const generation = this.lockGeneration;
    const random = cryptoFramework.createRandom();
    const identifier = (await random.generateRandom(16)).data;
    let keyId = '';
    for (let i = 0; i < identifier.length; i++) keyId += identifier[i].toString(16).padStart(2, '0');
    const alias = this.alias(keyId);
    const options = this.signOptions();
    if (authTypes.length) {
      let mask = 0;
      for (const type of authTypes) mask |= this.authenticationType(type);
      options.properties!.push({tag: huks.HuksTag.HUKS_TAG_USER_AUTH_TYPE, value: mask});
      options.properties!.push({tag: huks.HuksTag.HUKS_TAG_KEY_AUTH_ACCESS_TYPE,
        value: huks.HuksAuthAccessType.HUKS_AUTH_ACCESS_INVALID_CLEAR_PASSWORD});
      options.properties!.push({tag: huks.HuksTag.HUKS_TAG_CHALLENGE_TYPE,
        value: huks.HuksChallengeType.HUKS_CHALLENGE_TYPE_NORMAL});
      options.properties!.push({tag: huks.HuksTag.HUKS_TAG_KEY_AUTH_PURPOSE,
        value: huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_SIGN});
    }
    let generated = false;
    try {
      if (deviceInfo.sdkApiVersion >= 26) {
        const enhanced: huks.HuksOptions = {properties: options.properties!.concat([{
          tag: huks.HuksTag.HUKS_TAG_KEY_SECURITY_LEVEL,
          value: huks.HuksKeySecurityLevel.HUKS_KEY_SECURITY_LEVEL_TEE,
        }])};
        try { await huks.generateKeyItem(alias, enhanced); }
        catch (error) {
          const code = (error as BusinessError).code;
          if (code !== 801 && code !== 12000001) throw error as Error;
          await huks.generateKeyItem(alias, options);
        }
      } else { await huks.generateKeyItem(alias, options); }
      generated = true;
      const exported = (await huks.exportKeyItem(alias, this.location())).outData;
      if (!exported) throw new Error('Missing public key');
      const pair = await cryptoFramework.createAsyKeyGenerator('ECC256').convertKey({data: exported}, null);
      const x = pair.pubKey.getAsyKeySpec(cryptoFramework.AsyKeySpecItem.ECC_PK_X_BN) as bigint;
      const y = pair.pubKey.getAsyKeySpec(cryptoFramework.AsyKeySpecItem.ECC_PK_Y_BN) as bigint;
      let protection = 'unknown';
      if (deviceInfo.sdkApiVersion >= 26) {
        const properties = (await huks.getKeyItemProperties(alias, this.location())).properties;
        const level = properties?.find((param: huks.HuksParam) => param.tag === huks.HuksTag.HUKS_TAG_KEY_SECURITY_LEVEL);
        if (level?.value === huks.HuksKeySecurityLevel.HUKS_KEY_SECURITY_LEVEL_TEE) protection = 'tee';
      }
      const credential: HuksPasskey = {
        keyId: keyId,
        credentialId: encodePasskeyBytes((await random.generateRandom(32)).data),
        publicKeyX: encodePasskeyBytes(coordinate(x)), publicKeyY: encodePasskeyBytes(coordinate(y)),
        publicKeyDer: encodePasskeyBytes(exported), protectionLevel: protection,
        userAuthTypes: authTypes, authenticationMode: mode,
      };
      await this.ensureUnlocked(generation);
      await this.metadata.put(alias, JSON.stringify(credential));
      await this.metadata.put(alias + '.counter', 0);
      await this.metadata.flush();
      return credential;
    } catch (error) {
      if (generated) await huks.deleteKeyItem(alias, this.location()).catch(() => {});
      await this.metadata.delete(alias);
      await this.metadata.delete(alias + '.counter');
      await this.metadata.flush();
      throw error as Error;
    }
  }

  async getCredential(keyId: string): Promise<HuksPasskey | null> {
    await this.ready;
    const alias = this.alias(keyId);
    const raw = await this.metadata.get(alias, '');
    if (typeof raw !== 'string' || !raw) return null;
    if (!await huks.isKeyItemExist(alias, this.location())) return null;
    const key = JSON.parse(raw) as HuksPasskey;
    if (key.keyId !== keyId || key.userAuthTypes.some((type: number) => ![1, 2, 4].includes(type))) {
      throw new Error('Invalid Passkey metadata');
    }
    key.authenticationMode = key.userAuthTypes.length ? 'required' : 'silent';
    return key;
  }

  async initSigning(keyId: string): Promise<huks.HuksSessionHandle> {
    await this.ensureUnlocked();
    const session = await huks.initSession(this.alias(keyId), this.signOptions());
    this.sessions.add(session.handle);
    return session;
  }

  async finishSigning(handle: number, data: Uint8Array, token?: Uint8Array): Promise<Uint8Array> {
    // HUKS distinguishes an omitted third argument from an explicit undefined.
    const result = token === undefined ? await huks.finishSession(handle, this.signOptions(data)) :
      await huks.finishSession(handle, this.signOptions(data), token);
    this.sessions.delete(handle);
    if (!result.outData) throw new Error('Missing signature');
    return result.outData;
  }

  async abortSigning(handle: number): Promise<void> {
    this.sessions.delete(handle);
    await huks.abortSession(handle, this.location()).catch(() => {});
  }

  async authenticate(challenge: Uint8Array, types: userAuth.UserAuthType[]): Promise<Uint8Array> {
    await this.ensureUnlocked();
    if (!this.isForeground()) throw new Error('PASSKEY_INTERACTION_REQUIRED');
    if (!challenge.length || challenge.length > 32) throw new Error('Invalid authentication challenge');
    const instance = userAuth.getUserAuthInstance({
      challenge: challenge, authType: types, authTrustLevel: userAuth.AuthTrustLevel.ATL3,
      skipLockedBiometricAuth: true,
    }, {title: '使用 Passkey 登录'});
    this.authentication = instance;
    try {
      return await new Promise<Uint8Array>((resolve, reject) => {
        const callback: userAuth.IAuthCallback = {onResult: (result: userAuth.UserAuthResult): void => {
          try { instance.off('result', callback); } catch { /* The result may already have removed the listener. */ }
          if (result.result === userAuth.UserAuthResultCode.SUCCESS && result.token?.length) resolve(result.token);
          else reject(new Error(result.result === userAuth.UserAuthResultCode.CANCELED ||
            result.result === userAuth.UserAuthResultCode.CANCELED_FROM_WIDGET ? 'PASSKEY_CANCELED' : 'PASSKEY_AUTH_UNAVAILABLE'));
        }};
        try {
          instance.on('result', callback);
          instance.start();
        } catch (error) {
          try { instance.off('result', callback); } catch { /* Subscription may not have succeeded. */ }
          reject(new Error('PASSKEY_AUTH_UNAVAILABLE'));
        }
      });
    } finally { this.authentication = undefined; }
  }

  async signAssertion(keyId: string, challenge: string): Promise<HuksAssertion> {
    await this.ensureUnlocked();
    const generation = this.lockGeneration;
    if (!/^[A-Za-z0-9_-]{16,1024}$/.test(challenge)) throw new Error('Invalid challenge');
    const key = await this.getCredential(keyId);
    if (!key) throw new Error('PASSKEY_KEY_INVALIDATED');
    const available = this.availableAuthenticationTypes();
    const types = key.userAuthTypes.filter((type: number) => available.includes(type));
    if (key.authenticationMode === 'required' && !types.length) throw new Error('PASSKEY_AUTH_UNAVAILABLE');
    const alias = this.alias(keyId);
    const counter = Number(await this.metadata.get(alias + '.counter', 0)) + 1;
    if (!Number.isInteger(counter) || counter < 1 || counter > 0xffffffff) throw new Error('Invalid counter');
    // Persist before signing so an interrupted request cannot reuse a counter.
    await this.metadata.put(alias + '.counter', counter);
    await this.metadata.flush();
    const client = utf8(JSON.stringify({type: 'webauthn.get', challenge: challenge, origin: ORIGIN, crossOrigin: false}));
    const suffix = new Uint8Array(5);
    // Silent mode declares UP/UV in software. Only protected keys actually verify the user for each signature.
    suffix[0] = 0x05;
    new DataView(suffix.buffer).setUint32(1, counter, false);
    const authenticator = concatenate(await sha256(utf8(RP_ID)), suffix);
    const data = concatenate(authenticator, await sha256(client));
    const session = await this.initSigning(keyId);
    try {
      const token = types.length ? await this.authenticate(session.challenge!, types) : undefined;
      await this.ensureUnlocked(generation);
      const signature = await this.finishSigning(session.handle, data, token);
      await this.ensureUnlocked(generation);
      return {clientDataJSON: encodePasskeyBytes(client), authenticatorData: encodePasskeyBytes(authenticator),
        signature: encodePasskeyBytes(signature)};
    } finally { await this.abortSigning(session.handle); }
  }

  async deleteCredential(keyId: string): Promise<void> {
    await this.ready;
    const alias = this.alias(keyId);
    if (await huks.isKeyItemExist(alias, this.location())) await huks.deleteKeyItem(alias, this.location());
    await this.metadata.delete(alias);
    await this.metadata.delete(alias + '.counter');
    await this.metadata.flush();
  }

  private async abortSessions(): Promise<void> {
    for (const handle of this.sessions) await this.abortSigning(handle);
  }

  destroy(): void {
    this.destroyed = true;
    this.lockGeneration++;
    this.authentication?.cancel();
    this.abortSessions().catch(() => {});
    if (this.subscriber) commonEventManager.unsubscribe(this.subscriber, (_error: BusinessError): void => {});
  }
}
