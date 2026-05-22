#!/bin/bash

set -e

# Reverse 09ff3a86 (snackbar v3) except lockfiles—avoids git revert merge conflicts on package.json.
# --3way tolerates nearby edits (e.g. schedule.tsx) when plain -R fails.
git diff 09ff3a86^..09ff3a86 -- \
	':(exclude)apps/thu-info-app/package.json' \
	':(exclude)yarn.lock' \
	| git apply -R --3way

cd packages/thu-info-lib/
yarn add cheerio@1.0.0-rc.12
cd ../../

rm package.json
mv yarn.lock apps/thu-info-app/
cd apps/thu-info-app/
yarn add @react-native-oh/react-native-harmony@0.82.29 \
         @react-native-oh/react-native-harmony-cli@0.82.29 \
         @react-native-ohos/async-storage@2.2.1 \
         @react-native-ohos/blur@4.5.0 \
         @react-native-ohos/camera-roll@7.8.4 \
         @react-native-ohos/cookies@6.3.0 \
         @react-native-ohos/clipboard@1.16.3 \
         @react-native-ohos/react-native-blob-util@0.22.2-1 \
         @react-native-ohos/react-native-device-info@14.0.6 \
         @react-native-ohos/react-native-gesture-handler@2.30.1 \
         @react-native-ohos/react-native-get-random-values@1.12.0 \
         @react-native-ohos/react-native-localize@3.6.2 \
         @react-native-ohos/react-native-safe-area-context@5.6.3 \
         @react-native-ohos/react-native-share@10.2.2 \
         @react-native-ohos/react-native-snackbar@2.9.1 \
         @react-native-ohos/react-native-svg@15.13.0 \
         @react-native-ohos/react-native-version-number@0.4.0 \
         @react-native-ohos/react-native-webview@13.16.1 \
         @react-native-ohos/slider@5.1.2 \
         @thu-info/lib@../../packages/thu-info-lib \
         memfs@4.12.0 \
         rtn-network-utils@../../packages/RTNNetworkUtils \
         react@19.1.1 \
         react-native@0.82.1 \
         react-native-screens@4.24.0 \
         react-native-snackbar@2.9.0 \
         strip-ansi@6.0.1
yarn patch-package
cd harmony/
ohpm install
cd entry/
ohpm install
