import {Linking} from "react-native";

export const doAlipay = (payCode: string) =>
	Linking.openURL(
		"alipayqr://platformapi/startapp?saId=10000007&qrcode=https%3A%2F%2Fqr.alipay.com%2F" +
			payCode,
	);
