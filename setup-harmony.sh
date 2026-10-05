#!/bin/bash

set -e

# The app's Babel configuration adapts Snackbar exports for Harmony bundles.
# Keep shared sources intact so incremental builds and Metro use the same code.

yarn workspace @thu-info/lib add cheerio@1.0.0-rc.12
yarn workspace @thu-info/app add \
	@react-native-cookies/cookies@6.2.1 \
  @react-native-oh/react-native-harmony@0.84.4 \
  @react-native-oh/react-native-harmony-cli@0.84.4 \
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
	memfs@4.12.0 \
	react@19.2.3 \
	react-native@0.84.1 \
	react-native-gesture-handler@2.32.0 \
	react-native-screens@4.24.0 \
	react-native-snackbar@2.9.0 \
	strip-ansi@6.0.1

# Use the tooling from the same RN release as the Harmony runtime. This script
# prepares a Harmony build checkout; Android/iOS use the versions in package.json.
yarn workspace @thu-info/app add --dev \
  @react-native/babel-preset@0.84.1 \
  @react-native/codegen@0.84.1 \
  @react-native/metro-config@0.84.1 \
  @react-native/typescript-config@0.84.1

yarn patch-package

( cd apps/thu-info-app/harmony && ohpm install && cd entry && ohpm install )

# Turbo module codegen output (harmony/entry/src/main/cpp/generated, gitignored)
# must be regenerated after installing the harmony dependencies above.
yarn workspace @thu-info/app codegen-harmony
