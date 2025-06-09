#!/bin/bash

set -e

rm package.json
mv yarn.lock apps/thu-info-app/
cd apps/thu-info-app/
yarn add @react-native-oh/react-native-harmony@0.72.70 \
         @react-native-oh-tpl/async-storage@1.21.0-0.2.1 \
         @react-native-oh-tpl/blur@4.4.0-0.1.1 \
         @react-native-oh-tpl/camera-roll@7.8.3-0.1.2 \
         @react-native-oh-tpl/cookies@6.2.1-0.0.7 \
         @react-native-oh-tpl/react-native-blob-util@0.19.6-0.0.13 \
         @react-native-oh-tpl/clipboard@1.13.2-0.0.9 \
         @react-native-oh-tpl/react-native-device-info@11.1.0-0.0.5 \
         @react-native-oh-tpl/react-native-gesture-handler@2.14.1-2.14.15 \
         @react-native-oh-tpl/react-native-get-random-values@1.11.0-0.0.1 \
         @react-native-oh-tpl/react-native-localize@3.1.0-0.0.1 \
         @react-native-oh-tpl/react-native-safe-area-context@4.7.4-0.2.0 \
         @react-native-oh-tpl/react-native-share@10.2.1-0.0.2 \
         @react-native-oh-tpl/react-native-snackbar@2.7.1-0.0.2 \
         @react-native-oh-tpl/react-native-svg@15.0.0-0.5.9 \
         @react-native-oh-tpl/react-native-version-number@0.3.6-0.0.1 \
         @react-native-oh-tpl/react-native-webview@13.10.2-0.2.32 \
         @react-native-oh-tpl/slider@4.4.3-0.3.3 \
         @thu-info/lib@../../packages/thu-info-lib \
         rtn-network-utils@../../packages/RTNNetworkUtils \
         react@18.3.1 \
         react-native-svg@15.0.0 \
         react-native-gesture-handler@2.14.1 \
         react-native@0.72.17
yarn patch-package
