import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type {
  TurboModule,
  TurboModuleContext
} from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { NetworkUtilsModule } from './turbomodule/NetworkUtilsModule';
import { WidgetModule } from './turbomodule/WidgetModule';
class GeneratedTurboModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === TM.RTNNativeNetworkUtils.NAME) {
      return new NetworkUtilsModule(this.ctx);
    }
    if (name === TM.RTNWidget.NAME) {
      return new WidgetModule(this.ctx);
    }
    return null;
  }
  hasTurboModule(name: string): boolean {
    return name === TM.RTNNativeNetworkUtils.NAME || name === TM.RTNWidget.NAME;
  }
}
export class GeneratedPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new GeneratedTurboModulesFactory(ctx);
  }
}
