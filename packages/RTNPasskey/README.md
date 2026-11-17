# RTNPasskey

Native P-256 signing for THU Info's app-managed Passkey flow. Portal registration,
login and session recovery stay in `@thu-info/lib`; the shared React Native spec
returns JSON containing public credential metadata and DER-encoded signatures.
Private keys are never returned to JavaScript.

## iOS integration

The local `RTNPasskey.podspec` enables CocoaPods autolinking. Codegen maps
`RTNPasskey` to the Objective-C++ implementation in `ios/`. On a Mac, install the
repository's dependencies, then run from the repository root:

```sh
bundle install
cd apps/thu-info-app/ios
bundle exec pod install
```

Open `thu_info.xcworkspace` after installing Pods. This change was authored on
Linux: **no tests, CocoaPods installation, iOS build, simulator run or device run
were performed**. `Podfile.lock` must be regenerated on the Mac when the new local
pod is installed; generated Codegen files are not committed.

## iOS behavior

- New app enrollments prefer the shared `required` authentication mode. If
  device verification is unsupported or not configured, default enrollment uses
  `silent`. An unknown capability is tried with `required`; only a native
  `verification-unavailable` failure during key creation permits one silent
  retry. Explicit mode changes and existing credentials never silently downgrade.
  Secure Enclave keys combine `privateKeyUsage` and `userPresence`. The system selects
  Face ID, Touch ID or the device passcode; no biometric-only restriction or
  passcode-only policy is imposed.
- Each assertion uses a fresh `LAContext` with no unlock reuse and a freshly
  retrieved private-key reference. The key's access control authorizes signing.
  There is no separate JavaScript boolean that can authorize a protected key.
- Required-mode keys and metadata use `WhenPasscodeSetThisDeviceOnly`; removing
  the device passcode invalidates them. Devices without a passcode cannot enable
  required mode. The existing UI lets the user explicitly choose silent mode.
- Silent keys use `WhenUnlockedThisDeviceOnly` without `userPresence`. Both modes
  declare UP and UV in protocol responses. The app's product policy treats
  accessing and using the app as application-level user verification, allowing
  compatibility with the school's UV requirement. In silent mode this software
  declaration is not evidence of per-use native face, fingerprint or passcode
  verification. Required keys retain their native authorization constraints.
- Real devices request Secure Enclave keys and report `hardware` protection.
  The simulator uses a software Keychain key, reported as `software`. A real
  device can fall back to a software key only on `errSecUnimplemented`; canceled
  authentication, locked devices, entitlement errors and generic failures do
  not trigger fallback or change authentication mode. Software keys are not
  claimed to have the Secure Enclave's non-exportability guarantee.
- Metadata and the counter stay in the local, non-synchronizing Keychain.
  Counters are advanced and persisted before signing, and native operations are
  serialized. Interrupted requests can leave counter gaps.
- `createCredential(mode)` always creates an `id.tsinghua.edu.cn` key and stores
  that fixed RP in its metadata. Normal signing accepts only these keys. The
  origin remains `https://id.tsinghua.edu.cn`; callers cannot choose either RP
  or origin. Registration declares UV under the same application policy without
  an extra signing prompt. Activation still requires a full login with the new
  credential and its actual native authentication mode.
- The sole legacy baseline is release tag `v3.20.0` (`9e0d7854`). Its JS account
  credential records contain the fixed apex RP, but native metadata has no RP
  field. Only `signLegacyAssertionForMigration` accepts that exact native shape
  and signs for `tsinghua.edu.cn`. It rejects new keys; the normal signer rejects
  old keys. Unreleased JSON creation parameters and dynamic-RP formats are not
  supported.
- `InfoHelper.loginForPasskeyMigration` scopes legacy authentication to the
  session bootstrap needed for replacement. The app gates normal account use
  until a new id. key has passed full login and durable activation. Revocation
  and local deletion happen afterward; failed cleanup remains queued by exact
  credential ID and is retried on a later login.
  Replacement preserves the old credential's required or silent mode.
- Backgrounding, loss of protected data or module invalidation cancels pending
  authentication. System authentication's temporary `inactive` state does not
  cancel it or restart the shared app-lock timer. Returning from actual
  background still applies the existing app-lock timeout.
- Deletion matches only this credential's UUID tag. Names and device models do
  not participate in deletion. Existing shared activation/rotation logic keeps
  the old credential until full school login succeeds.

## School RP selection

The public login wrapper first calls `biometricLogin({username})`, then retries
without a username after failure. Its local storage records the username, not
the RP. The RP itself comes from the server's login options. Observed on
2026-11-17: the no-username entry and enrollment options use
`id.tsinghua.edu.cn`, while username-based login can still select
`tsinghua.edu.cn`. Whether this is specifically the last successful RP is not
established by these read-only observations.

Normal login always requests `/api/webauthn/login/options` without a query
string and selects the current account's credential locally. The response RP
must be `id.tsinghua.edu.cn`; an apex or other unexpected RP throws an
`unsupported` Passkey error before signing or submitting verification. There is
no retry or automatic migration on this error. The temporary migration entry
alone adds `username` and `credentialId` to request and sign an apex challenge
for the selected old credential.

Coordinate the migration window with the school. After that window, remove the
isolated migration API and school compatibility layer; remaining old users can
replace their credentials through password recovery.

Official sources: [login wrapper](https://id.tsinghua.edu.cn/res/selfservice/webAuthnLogin.js),
[WebAuthn client](https://id.tsinghua.edu.cn/v2/dist/webauthn/webauthn.bundle.js).

## Counter validation

An isolated test on 2026-11-17 registered a new `id.tsinghua.edu.cn` credential
with counter 0. The school accepted counter 1, then accepted counter 4 after two
local-only signatures consumed counters 2 and 3. This confirms that the new-RP
path accepts counter gaps; it does not establish the apex compatibility path's
behavior. The test credential was revoked and deleted afterward.

A separate temporary software credential was tested with counters 1, 4, 2 and
5. The school accepted 1 and 4, rejected 2 with `counter-mismatch`, then accepted
5. The rejected counter regression did not permanently disable this new-RP
credential. That test credential was also revoked afterward.

A legacy apex credential returned `Malicious counter value is detected` during
verification. The server did not disclose its stored counter, so the precise
cause of the mismatch is undetermined. The app reports this as
`counter-mismatch` and offers password-based re-registration.

## Device validation handoff

The following are pending checks for the developer with an iOS test environment,
not results from this implementation:

1. Install Pods and build using the repository's React Native version. Confirm
   the module is found and the Passkey settings row is available.
2. With a device passcode and Face ID / Touch ID enrolled, enable Passkey and
   confirm the system verifies the user during the school login. Exercise the
   device-passcode fallback and a passcode-only device as well.
3. Log out and use Passkey to log in without a school password. Check cold
   restart and expired-session recovery. Confirm password persistence is empty.
4. Repeat with the app lock enabled and its timeout set to zero. A system
   authentication prompt must not relock the app; actual backgrounding must.
5. Cancel verification, background the app during a prompt and lock the device.
   No canceled/locked operation should return an assertion or silently retry.
6. Toggle silent login both ways, cancel a mode change and remove/re-enable
   Passkey. Both modes should register and log in under a UV-required school
   policy. Check the confirmation dialogs and exact-credential cleanup.
7. Check the no-device-passcode case: required mode should explain that
   verification is unavailable when explicitly requested; a new default setup
   should instead use silent mode. Remove the passcode after required enrollment
   to check key invalidation without an automatic downgrade.
8. On a physical device, confirm hardware protection; on the simulator, check
   software protection. Two same-model devices must retain independent keys.

API references: [Secure Enclave key access](https://developer.apple.com/documentation/security/protecting-keys-with-the-secure-enclave),
[userPresence](https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/userpresence),
[privateKeyUsage](https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/privatekeyusage),
[LAContext authorization and key binding](https://developer.apple.com/videos/play/wwdc2022/10108/).
