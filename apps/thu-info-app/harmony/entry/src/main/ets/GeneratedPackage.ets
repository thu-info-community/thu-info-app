import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type {
  TurboModule,
  TurboModuleContext
} from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { NetworkUtilsModule } from './turbomodule/NetworkUtilsModule';
class GeneratedTurboModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === TM.RTNNativeNetworkUtils.NAME) {
      return new NetworkUtilsModule(this.ctx);
    }
    return null;
  }
  hasTurboModule(name: string): boolean {
    return name === TM.RTNNativeNetworkUtils.NAME;
  }
}
export class GeneratedPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new GeneratedTurboModulesFactory(ctx);
  }
}
