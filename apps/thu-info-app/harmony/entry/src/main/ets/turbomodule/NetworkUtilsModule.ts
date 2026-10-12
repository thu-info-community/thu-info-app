import { TurboModule } from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { rcp } from "@kit.RemoteCommunicationKit";
import { BusinessError } from "@kit.BasicServicesKit";
import web_webview from "@ohos.web.webview";

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

	async getRedirectResponse(url: string, timeoutMs: number): Promise<{
		status: number;
		location: string | null;
	}> {
		const request = new rcp.Request(url, "GET");
		const session = rcp.createSession({
			requestConfiguration: {
				transfer: {
					autoRedirect: false,
				},
			},
		});
		let timer: number | undefined;
		try {
			const cookie = await web_webview.WebCookieManager.fetchCookie(url);
			if (cookie !== "") {
				request.headers = { Cookie: cookie };
			}
			const responsePromise = session.fetch(request);
			const timeoutPromise = new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error("Redirect request timeout.")), timeoutMs);
			});
			const response = await Promise.race([responsePromise, timeoutPromise]);
			const headers = response.headers as Record<string, string | string[] | undefined>;
			const setCookie = headers["set-cookie"] ?? headers["Set-Cookie"];
			const setCookies: string[] = [];
			if (typeof setCookie === "string") {
				setCookies.push(setCookie);
			} else if (Array.isArray(setCookie)) {
				for (const value of setCookie) {
					if (typeof value === "string") {
						setCookies.push(value);
					}
				}
			}
			for (const value of setCookies) {
				await web_webview.WebCookieManager.configCookie(url, value);
			}
			const locationHeader = headers.location ?? headers.Location;
			return {
				status: response.statusCode,
				location: typeof locationHeader === "string" ? locationHeader : null,
			};
		} catch (error) {
			throw error as BusinessError;
		} finally {
			if (timer !== undefined) {
				clearTimeout(timer);
			}
		}
	}
}
