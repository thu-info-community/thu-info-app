/**
 * Original author: THUzxj
 */
import {WATER_SUB_URL, WATER_USER_URL} from "../constants/strings";
import {stringify} from "thu-info-lib/dist/utils/network";
import {CONTENT_TYPE_FORM} from "thu-info-lib/dist/constants/strings";

export interface WaterUserInformation {
	phone: string;
	address: string;
}

export const getWaterUserInformation = async (
	id: string,
): Promise<WaterUserInformation> => {
	if (id.trim().length === 0) {
		return {phone: "", address: ""};
	} else {
		return fetch(WATER_USER_URL, {
			headers: {"Content-Type": CONTENT_TYPE_FORM},
			method: "POST",
			body: stringify({name: "pw", param: id}),
		}).then((r) => r.json());
	}
};

export const waterBrandIdToName: {[key: string]: string} = {
	"6": "清紫源泉矿泉水（高端）",
	"10": "燕园泉矿泉水（高端）",
	"12": "农夫山泉桶装水（19L）",
	"11": "清紫源泉矿泉水",
	"8": "喜士天然矿泉水（大）",
	"9": "喜士天然矿泉水（小）",
	"1": "娃哈哈矿泉水",
	"7": "娃哈哈纯净水",
	"5": "清紫源泉纯净水",
};

export const postWaterSubmission = (
	id: string,
	num: string, // 订水量
	num1: string, // 订水票量
	lid: string, // 水种类
	address: string,
): Promise<void> =>
	fetch(WATER_SUB_URL, {
		headers: {"Content-Type": CONTENT_TYPE_FORM},
		method: "POST",
		body: stringify({pw: id, num, num1, lid, address}),
	})
		.then((r) => r.text())
		.then((res) => {
			if (!res.includes("成功")) {
				throw new Error("Submission failed");
			}
		});
