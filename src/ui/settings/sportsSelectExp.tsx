import React, {useState} from "react";
import {
	Alert,
	Button,
	Image,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {SettingsNav, SportsSelectProp} from "./settingsStack";
import themes from "../../assets/themes/themes";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import {doAlipay} from "../../utils/alipay";

export const SportsSelectScreen = ({
	route: {
		params: {
			info: {name, gymId, itemId},
			date,
			phone,
			availableFields,
		},
	},
	navigation,
}: {
	route: SportsSelectProp;
	navigation: SettingsNav;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [field, setField] = useState<{id: string; name: string} | undefined>(
		undefined,
	);
	const [imageUrl, setImageUrl] = useState(helper.getSportsCaptchaUrl());
	const [captcha, setCaptcha] = useState("");
	const [totalCost, setTotalCost] = useState(0);
	console.log(imageUrl);

	return (
		<ScrollView>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10, color: "red"}}>
					{"该功能为试验性功能，如遇任何问题请第一时间向我们反馈！"}
				</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{name}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{date}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{phone}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{getStr("selectField")}</Text>
			</View>
			{availableFields.map((f) => (
				<View
					style={{borderTopColor: "lightgrey", borderTopWidth: 1}}
					key={f.id}>
					<TouchableOpacity
						onPress={() => {
							setField(f);
							setTotalCost(f.cost);
						}}>
						<Text
							style={{
								padding: 10,
								color:
									field === undefined
										? colors.text
										: f.id === field.id
										? "blue"
										: "lightgrey",
							}}>
							{f.name} （{f.cost}元）
						</Text>
					</TouchableOpacity>
				</View>
			))}
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>总计{totalCost}元</Text>
			</View>
			<View
				style={{
					borderTopColor: "lightgrey",
					borderTopWidth: 1,
					borderBottomColor: "lightgrey",
					borderBottomWidth: 1,
					flexDirection: "row",
					alignItems: "center",
				}}>
				<Image source={{uri: imageUrl}} style={{height: 50, width: 200}} />
				<TextInput
					style={{flex: 1}}
					value={captcha}
					onChangeText={setCaptcha}
					placeholder={getStr("captchaCaseSensitive")}
				/>
				<Button
					title={getStr("refresh")}
					onPress={() => setImageUrl(helper.getSportsCaptchaUrl())}
				/>
			</View>
			<TouchableOpacity
				style={{
					backgroundColor:
						field === undefined || captcha.trim().length === 0
							? "lightgrey"
							: colors.accent,
					marginTop: 10,
				}}
				onPress={() => {
					if (totalCost > 42) {
						Alert.alert(
							"无法通过该 APP 预约。",
							"出于安全考虑，使用本 APP 发起支付请求时，单笔金额不得超过 42 元。",
						);
						return;
					}
					if (field !== undefined) {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						helper
							.makeSportsReservation(
								totalCost,
								phone,
								gymId,
								itemId,
								date,
								captcha,
								field.id,
							)
							.then(doAlipay)
							.then(() => navigation.pop())
							.catch(NetworkRetry);
					}
				}}
				disabled={field === undefined || captcha.trim().length === 0}>
				<Text
					style={{
						fontSize: 20,
						padding: 10,
						color: colors.background,
						textAlign: "center",
					}}>
					{getStr("submit")}
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};
