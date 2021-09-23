import {Button, Image, Text, TextInput, View} from "react-native";
import React, {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import dayjs from "dayjs";
import Snackbar from "react-native-snackbar";
import {doAlipay} from "../../utils/alipay";

export const SportsExpScreen = () => {
	const [uri, setUri] = useState<string>();
	const [input, setInput] = useState<string>("");
	const date = dayjs().format("YYYY-MM-DD");

	useEffect(() => setUri(helper.getSportsCaptchaUrl()), []);

	return (
		<>
			<Image source={{uri}} style={{height: 100}} />
			<View style={{flexDirection: "row"}}>
				<TextInput style={{flex: 1}} onChangeText={setInput} />
				<Button
					title={getStr("confirm")}
					onPress={() =>
						helper
							.getSportsResources("4836273", "14567218", date)
							.then(({phone, data, count, init}) => {
								const item = data.find(
									(r) => r.locked !== true && r.userType === undefined,
								);
								if (item === undefined) {
									Snackbar.show({
										text: "未找到空场地",
										duration: Snackbar.LENGTH_SHORT,
									});
								} else if (
									phone === undefined ||
									item.cost === undefined ||
									count !== 1 ||
									init !== 1
								) {
									Snackbar.show({
										text: "其他错误",
										duration: Snackbar.LENGTH_SHORT,
									});
								} else {
									Snackbar.show({
										text: "正在处理",
										duration: Snackbar.LENGTH_SHORT,
									});
									helper
										.makeSportsReservation(
											item.cost,
											phone,
											"4836273",
											"14567218",
											date,
											input,
											item.resId,
										)
										.then(doAlipay);
								}
							})
					}
				/>
			</View>
			<Text>将会在{date}的西体可用的台球场中随机选择一个预约。</Text>
		</>
	);
};
