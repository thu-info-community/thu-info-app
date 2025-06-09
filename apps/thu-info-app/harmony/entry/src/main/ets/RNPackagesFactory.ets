import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import { AsyncStoragePackage } from '@react-native-oh-tpl/async-storage/ts';
import RnohReactNativeHarmonyGestureHandlerPackage from '@react-native-oh-tpl/react-native-gesture-handler';
import { RNSnackbarPackage } from '@react-native-oh-tpl/react-native-snackbar/ts';
import { ClipboardPackage } from '@react-native-oh-tpl/clipboard/ts';
import { CookiesPackage } from 'roh_cookies/src/main/ets/CookiesPackage';
import { RNGetRandomValuesPackage } from '@react-native-oh-tpl/react-native-get-random-values/ts';
import { RNSharePackage } from 'react-native-share/ts';
import { RNLocalizePackage } from '@react-native-oh-tpl/react-native-localize/ts';
import { BlobUtilPackage } from '@react-native-oh-tpl/react-native-blob-util/ts';
import { RNVersionNumberPackage } from '@react-native-oh-tpl/react-native-version-number/ts';
import { SvgPackage } from '@react-native-oh-tpl/react-native-svg/ts';
import { SafeAreaViewPackage } from '@react-native-oh-tpl/react-native-safe-area-context/ts';
import { WebViewPackage } from '@react-native-oh-tpl/react-native-webview/ts';
import { RNDeviceInfoPackage } from '@react-native-oh-tpl/react-native-device-info/ts';
import { CameraRollPackage } from '@react-native-oh-tpl/camera-roll/ts';
import { GeneratedPackage } from './GeneratedPackage';

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
    new GeneratedPackage(ctx),
  ];
}
