import {Linking} from "react-native";

export const hasAlipay = () =>
	Linking.canOpenURL("alipayqr://").then((support) => {
		if (!support) {
			throw new Error("Alipay not found.");
		}
	});

export const doAlipay = (payCode: string) =>
	Linking.openURL(
		"alipayqr://platformapi/startapp?saId=10000007&qrcode=https%3A%2F%2Fqr.alipay.com%2F" +
			payCode,
	);
