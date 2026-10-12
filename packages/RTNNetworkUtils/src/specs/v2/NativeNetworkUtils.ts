import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
    getRedirectLocation(url: string): Promise<string | null | undefined>;
    getRedirectResponse(url: string, timeoutMs: number): Promise<{
        status: number;
        location: string | null;
    }>;
}

export default TurboModuleRegistry.get<Spec>(
    'RTNNativeNetworkUtils',
) as Spec | null;
