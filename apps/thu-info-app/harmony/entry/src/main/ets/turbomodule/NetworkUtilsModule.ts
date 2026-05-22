import { TurboModule } from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { rcp } from "@kit.RemoteCommunicationKit";
import { BusinessError } from "@kit.BasicServicesKit";

export class NetworkUtilsModule extends TurboModule implements TM.RTNNativeNetworkUtils.Spec {
	getRedirectLocation(url: string): Promise<string | null | undefined>{
		const request = new rcp.Request(url, "GET");
		const session = rcp.createSession({
			requestConfiguration: {
				transfer: {
					autoRedirect: false,
				},
			},
		});
		return session.fetch(request).then((rep: rcp.Response) => {
			return rep.headers?.location;
		}).catch((_err: BusinessError) => {
			// console.error(`Response err: Code is ${err.code}, message is ${JSON.stringify(err)}`);
			return undefined;
		});
	}
}
