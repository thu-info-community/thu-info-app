import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { HuksPasskeyStore } from './HuksPasskeyStore';

export class PasskeyModule extends TurboModule implements TM.RTNPasskey.Spec {
  private keys = new HuksPasskeyStore(this.ctx.uiAbilityContext);
  private pending: Promise<void> = Promise.resolve();

  private operation<T>(action: () => Promise<T>): Promise<T> {
    const result = this.pending.then(action);
    this.pending = result.then(() => {}, () => {});
    return result;
  }

  async getCapabilities(): Promise<string> {
    return JSON.stringify({available: await this.keys.available()});
  }

  createCredential(): Promise<string> {
    return this.operation(async (): Promise<string> => JSON.stringify(await this.keys.createCredential()));
  }

  getCredential(keyId: string): Promise<string> {
    return this.operation(async (): Promise<string> => JSON.stringify(await this.keys.getCredential(keyId)));
  }

  signAssertion(keyId: string, challenge: string): Promise<string> {
    return this.operation(async (): Promise<string> => JSON.stringify(await this.keys.signAssertion(keyId, challenge)));
  }

  deleteCredential(keyId: string): Promise<void> {
    return this.operation(async (): Promise<void> => this.keys.deleteCredential(keyId));
  }

  __onDestroy__(): void {
    this.keys.destroy();
    super.__onDestroy__();
  }
}
