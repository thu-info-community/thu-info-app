import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import { AsyncStoragePackage } from '@react-native-ohos/async-storage/ts';
import RnohReactNativeHarmonyGestureHandlerPackage from '@react-native-ohos/react-native-gesture-handler';
import { RNSnackbarPackage } from '@react-native-ohos/react-native-snackbar/ts';
import { ClipboardPackage } from '@react-native-ohos/clipboard/ts';
import { CookiesPackage } from '@react-native-ohos/cookies/src/main/ets/CookiesPackage';
import { RNGetRandomValuesPackage } from '@react-native-ohos/react-native-get-random-values/ts';
import { RNSharePackage } from '@react-native-ohos/react-native-share/ts';
import { RNLocalizePackage } from '@react-native-ohos/react-native-localize/ts';
import { BlobUtilPackage } from '@react-native-ohos/react-native-blob-util/ts';
import { RNVersionNumberPackage } from '@react-native-ohos/react-native-version-number/ts';
import { SafeAreaViewPackage } from '@react-native-ohos/react-native-safe-area-context/ts';
import { WebViewPackage } from '@react-native-ohos/react-native-webview/ts';
import { RNDeviceInfoPackage } from '@react-native-ohos/react-native-device-info/ts';
import { CameraRollPackage } from '@react-native-ohos/camera-roll/ts';
import { SvgPackage } from '@react-native-ohos/react-native-svg/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new AsyncStoragePackage(ctx),
    new RnohReactNativeHarmonyGestureHandlerPackage(ctx),
    new RNSnackbarPackage(ctx),
    new CookiesPackage(ctx),
    new RNGetRandomValuesPackage(ctx),
    new RNSharePackage(ctx),
    new RNLocalizePackage(ctx),
    new BlobUtilPackage(ctx),
    new ClipboardPackage(ctx),
    new RNVersionNumberPackage(ctx),
    new SvgPackage(ctx),
    new SafeAreaViewPackage(ctx),
    new WebViewPackage(ctx),
    new RNDeviceInfoPackage(ctx),
    new CameraRollPackage(ctx),
  ];
}
