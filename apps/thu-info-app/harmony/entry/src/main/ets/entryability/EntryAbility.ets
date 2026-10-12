import { AbilityConstant, Want } from '@kit.AbilityKit';
import { RNAbility } from "@rnoh/react-native-openharmony";
import { RNInstance } from "@rnoh/react-native-openharmony/ts";
import { writePendingLaunch } from '../widget/WidgetStore';
import { BusinessError } from '@kit.BasicServicesKit';

// The live RN instance is stashed here by pages/Index.ets (onSetUp) so a card
// tap delivered while the app is already foreground can still be forwarded.
const RN_INSTANCE_KEY = 'thuinfo_rn_instance';
export const LAUNCH_EVENT_NAME = 'widgetLaunch';

export default class EntryAbility extends RNAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    super.onCreate(want, launchParam);
    this.savePendingLaunch(want);
  }

  onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    super.onNewWant(want, launchParam);
    this.savePendingLaunch(want);
    // Cold start consumes the params via JS init; a tap while already running
    // never triggers an AppState change, so notify the instance directly.
    const rnInstance = AppStorage.get<RNInstance>(RN_INSTANCE_KEY);
    rnInstance?.emitDeviceEvent(LAUNCH_EVENT_NAME, {});
  }

  // A card tap launches the ability with the postCardAction router params
  // nested under want.parameters.params (a JSON string). Persist them for the
  // RN side to consume once the navigator is ready.
  private savePendingLaunch(want: Want): void {
    const raw = want.parameters?.params;
    if (typeof raw === 'string' && raw !== '') {
      writePendingLaunch(this.context, raw).catch((_err: BusinessError) => {});
    }
  }

  getPagePath() {
    return 'pages/Index';
  }
}
