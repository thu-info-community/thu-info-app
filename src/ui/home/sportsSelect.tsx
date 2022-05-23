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
import {RootNav, SportsSelectProp} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {doAlipay} from "../../utils/alipay";
import {
	VALID_RECEIPT_TITLES,
	ValidReceiptTypes,
} from "thu-info-lib/dist/lib/sports";

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
	navigation: RootNav;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [field, setField] = useState<{id: string; name: string} | undefined>(
		undefined,
	);
	const [title, setTitle] = useState<ValidReceiptTypes | undefined>(undefined);
	const [imageUrl, setImageUrl] = useState(helper.getSportsCaptchaUrl());
	const [captcha, setCaptcha] = useState("");
	const [totalCost, setTotalCost] = useState(0);

	return (
		<ScrollView>
			{!helper.mocked() && (
				<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
					<Text style={{padding: 10, color: "red"}}>
						{
							"该功能为试验性功能，如遇任何问题请第一时间向我们反馈！\n目前观察到的现象是，早上八点使用本软件预约几乎不可能成功，开发人员还在思考怎么解决这个问题，敬请期待……"
						}
					</Text>
				</View>
			)}
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10, color: colors.text}}>{name}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10, color: colors.text}}>{date}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10, color: colors.text}}>{phone}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10, color: colors.text}}>
					{getStr("selectField")}
				</Text>
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
				<Text style={{padding: 10, color: colors.text}}>总计{totalCost}元</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10, color: colors.text}}>
					{getStr("receiptTitle")}
				</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<TouchableOpacity onPress={() => setTitle(undefined)}>
					<Text
						style={{
							padding: 10,
							color: title === undefined ? "blue" : "lightgrey",
						}}>
						{"不需要发票"}
					</Text>
				</TouchableOpacity>
			</View>
			{VALID_RECEIPT_TITLES.map((receiptTitle) => (
				<View
					style={{borderTopColor: "lightgrey", borderTopWidth: 1}}
					key={receiptTitle}>
					<TouchableOpacity onPress={() => setTitle(receiptTitle)}>
						<Text
							style={{
								padding: 10,
								color: title === receiptTitle ? "blue" : "lightgrey",
							}}>
							{receiptTitle}
						</Text>
					</TouchableOpacity>
				</View>
			))}
			{!helper.mocked() && (
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
			)}
			<TouchableOpacity
				style={{
					backgroundColor:
						field === undefined ||
						(!helper.mocked() && captcha.trim().length === 0)
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
								title,
								gymId,
								itemId,
								date,
								captcha,
								field.id,
							)
							.then((paycode) => {
								if (paycode === undefined) {
									Snackbar.show({
										text: getStr("success"),
										duration: Snackbar.LENGTH_SHORT,
									});
									return Promise.resolve();
								} else {
									return doAlipay(paycode);
								}
							})
							.then(() => navigation.pop())
							.catch((e) => {
								Snackbar.show({
									text:
										typeof e.message === "string"
											? e.message
											: getStr("networkRetry"),
									duration: Snackbar.LENGTH_LONG,
								});
							});
					}
				}}
				disabled={
					field === undefined ||
					(!helper.mocked() && captcha.trim().length === 0)
				}>
				<Text
					style={{
						fontSize: 20,
						padding: 10,
						color: colors.themeBackground,
						textAlign: "center",
					}}>
					{getStr("submit")}
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};
