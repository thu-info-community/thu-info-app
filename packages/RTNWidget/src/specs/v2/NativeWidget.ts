import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
    // Persist the schedule snapshot and push it to every live home-screen card.
    updateScheduleSnapshot(snapshot: string): Promise<boolean>;
    // Return (and clear) launch params recorded when a card opened the app.
    consumeLaunchParams(): Promise<string | null>;
    // Diagnostics: live cards and last push time, as a JSON string.
    getWidgetStats(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('RTNWidget') as Spec | null;
