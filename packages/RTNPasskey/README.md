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

- New credentials default to the shared `required` authentication mode. Secure
  Enclave keys combine `privateKeyUsage` and `userPresence`. The system selects
  Face ID, Touch ID or the device passcode; no biometric-only restriction or
  passcode-only policy is imposed.
- Each assertion uses a fresh `LAContext` with no unlock reuse and a freshly
  retrieved private-key reference. The key's access control authorizes signing.
  There is no separate JavaScript boolean that can authorize a protected key.
- Required-mode keys and metadata use `WhenPasscodeSetThisDeviceOnly`; removing
  the device passcode invalidates them. Devices without a passcode cannot enable
  required mode. The existing UI lets the user explicitly choose silent mode.
- Silent keys use `WhenUnlockedThisDeviceOnly` without `userPresence`. As on the
  other platforms, the school requires UP/UV flags even for silent assertions;
  those flags are software declarations, not evidence of per-use verification.
- Real devices request Secure Enclave keys and report `hardware` protection.
  The simulator uses a software Keychain key, reported as `software`. A real
  device can fall back to a software key only on `errSecUnimplemented`; canceled
  authentication, locked devices, entitlement errors and generic failures do
  not trigger fallback or change authentication mode. Software keys are not
  claimed to have the Secure Enclave's non-exportability guarantee.
- Metadata and the counter stay in the local, non-synchronizing Keychain.
  Counters are advanced and persisted before signing, and native operations are
  serialized. Interrupted requests can leave counter gaps.
- RP ID and origin are fixed natively to `tsinghua.edu.cn` and
  `https://id.tsinghua.edu.cn`. There is no private-key export bridge or arbitrary
  RP/origin signing interface.
- Backgrounding, loss of protected data or module invalidation cancels pending
  authentication. System authentication's temporary `inactive` state does not
  cancel it or restart the shared app-lock timer. Returning from actual
  background still applies the existing app-lock timeout.
- Deletion matches only this credential's UUID tag. Names and device models do
  not participate in deletion. Existing shared activation/rotation logic keeps
  the old credential until full school login succeeds.

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
   Passkey. Check the existing confirmation dialogs and exact-credential cleanup.
7. Check the no-device-passcode case: required mode should explain that
   verification is unavailable; explicit silent mode should be attempted
   separately. Remove the passcode after enrollment to check key invalidation.
8. On a physical device, confirm hardware protection; on the simulator, check
   software protection. Two same-model devices must retain independent keys.

API references: [Secure Enclave key access](https://developer.apple.com/documentation/security/protecting-keys-with-the-secure-enclave),
[userPresence](https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/userpresence),
[privateKeyUsage](https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/privatekeyusage),
[LAContext authorization and key binding](https://developer.apple.com/videos/play/wwdc2022/10108/).
