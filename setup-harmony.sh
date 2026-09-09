#!/bin/bash

set -e

# Harmony uses Snackbar v2's default export. Convert current sources instead of
# reversing the v3 migration commit, whose patch conflicts with newer UI edits.
node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = 'apps/thu-info-app/src';
for (const entry of fs.readdirSync(root, {recursive: true})) {
  if (!/\.tsx?$/.test(entry)) continue;
  const file = path.join(root, entry);
  const source = fs.readFileSync(file, 'utf8');
  const converted = source.replace(
    /import\s*\{\s*Snackbar\s*\}\s*from\s*(['"])react-native-snackbar\1/g,
    'import Snackbar from $1react-native-snackbar$1',
  );
  if (converted !== source) fs.writeFileSync(file, converted);
}
NODE

yarn workspace @thu-info/lib add cheerio@1.0.0-rc.12
yarn workspace @thu-info/app add \
	@react-native-cookies/cookies@6.2.1 \
  @react-native-oh/react-native-harmony@0.82.29 \
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
	memfs@4.12.0 \
	react@19.1.1 \
	react-native@0.82.1 \
	react-native-gesture-handler@2.32.0 \
	react-native-screens@4.24.0 \
	react-native-snackbar@2.9.0 \
	strip-ansi@6.0.1

yarn patch-package

( cd apps/thu-info-app/harmony && ohpm install && cd entry && ohpm install )
