import {useEffect, useState} from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {RootNav, SportsSelectProp} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {SportsIdInfo} from "thu-info-lib/dist/models/home/sports";
import {setActiveSportsReservationRecord} from "../../redux/slices/reservation";
import {uFetch} from "thu-info-lib/dist/utils/network";
import {useDispatch} from "react-redux";

export interface SportsSelectParams {
	info: SportsIdInfo;
	date: string;
	phone: string;
	period: string;
	availableFields: {id: string; name: string; cost: number}[];
	selectedFieldIndex?: number;
}

export const SportsSelectScreen = ({
	route: {params},
	navigation,
}: {
	route: SportsSelectProp;
	navigation: RootNav;
}) => {
	const {
		info: {name, gymId, itemId},
		date,
		phone,
		period,
		availableFields,
		selectedFieldIndex,
	} = params;

	const dispatch = useDispatch();

	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [field, setField] = useState<
		{id: string; name: string; cost: number} | undefined
	>(undefined);
	const [phoneNumber, setPhoneNumber] = useState(phone);
	const [imageUrl, setImageUrl] = useState(helper.getSportsCaptchaUrl());
	const [imageBase64, setImageBase64] = useState("");
	const [captcha, setCaptcha] = useState("");
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		if (selectedFieldIndex !== undefined) {
			setField(availableFields[selectedFieldIndex]);
		}
	}, [availableFields, selectedFieldIndex]);

	useEffect(() => {
		uFetch(imageUrl).then(setImageBase64);
	}, [imageUrl]);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{flex: 1}}>
			<ScrollView>
				<RoundedView style={{marginHorizontal: 12, marginTop: 24, padding: 16}}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							style={{
								color: colors.text,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{getStr("gym")}
						</Text>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{name}
						</Text>
					</View>
					<View
						style={{
							borderWidth: 0.4,
							borderColor: colors.themeGrey,
							marginVertical: 12,
						}}
					/>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							style={{
								color: colors.text,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{getStr("date")}
						</Text>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{date}
						</Text>
					</View>
					<View
						style={{
							borderWidth: 0.4,
							borderColor: colors.themeGrey,
							marginVertical: 12,
						}}
					/>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							style={{
								color: colors.text,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{getStr("duration")}
						</Text>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{period}
						</Text>
					</View>
					<View
						style={{
							borderWidth: 0.4,
							borderColor: colors.themeGrey,
							marginVertical: 12,
						}}
					/>
					<TouchableOpacity
						onPress={() => navigation.navigate("SportsSelectField", params)}
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							style={{
								color: colors.text,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{getStr("field")}
						</Text>
						<View style={{flexDirection: "row", alignItems: "center"}}>
							<Text
								style={{
									color: colors.fontB3,
									fontSize: 16,
									lineHeight: 24,
								}}>
								{field === undefined
									? getStr("pleaseSelect")
									: `${field.name}（${field.cost}元）`}
							</Text>
							<IconRight height={24} width={24} />
						</View>
					</TouchableOpacity>
				</RoundedView>
				<RoundedView style={{marginHorizontal: 12, marginTop: 16, padding: 16}}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							style={{
								color: colors.text,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{getStr("phoneNumber")}
						</Text>
						<TextInput
							style={{
								color: colors.text,
								padding: 0,
								fontSize: 16,
								lineHeight: 24,
								textAlign: "right",
							}}
							value={phoneNumber}
							onChangeText={setPhoneNumber}
							placeholder={getStr("pleaseEnterPhone")}
							placeholderTextColor={colors.fontB3}
						/>
					</View>
				</RoundedView>
				{!helper.mocked() && (
					<RoundedView
						style={{marginHorizontal: 12, marginTop: 16, padding: 16}}>
						<TextInput
							style={{
								color: colors.text,
								padding: 0,
								fontSize: 16,
								lineHeight: 24,
							}}
							value={captcha}
							onChangeText={setCaptcha}
							placeholder={getStr("captchaCaseSensitive")}
							placeholderTextColor={colors.fontB3}
						/>
						<View
							style={{
								borderWidth: 0.4,
								borderColor: colors.themeGrey,
								marginVertical: 12,
							}}
						/>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
							}}>
							<Image
								source={{uri: `data:image/jpg;base64,${imageBase64}`}}
								style={{height: 50, width: 200}}
							/>
							<TouchableOpacity
								onPress={() => setImageUrl(helper.getSportsCaptchaUrl())}>
								<Text
									style={{
										color: colors.themePurple,
										fontSize: 16,
										lineHeight: 24,
									}}>
									{getStr("clickToRefresh")}
								</Text>
							</TouchableOpacity>
						</View>
					</RoundedView>
				)}
				<Text
					style={{
						marginTop: 50,
						marginRight: 12,
						alignSelf: "flex-end",
						fontSize: 16,
						color: colors.text,
					}}>
					{getStr("needToPay")}
					{field?.cost ?? 0}
				</Text>
				<TouchableOpacity
					style={{
						padding: 8,
						justifyContent: "center",
						alignItems: "center",
						borderRadius: 4,
						alignSelf: "flex-end",
						margin: 12,
						backgroundColor:
							field === undefined ||
							(!helper.mocked() &&
								(captcha.trim().length === 0 ||
									phoneNumber.trim().length === 0))
								? "lightgrey"
								: colors.themePurple,
					}}
					onPress={() => {
						if (field && field.cost > 42) {
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
							setProcessing(true);
							helper
								.makeSportsReservation(
									field.cost,
									phoneNumber,
									undefined,
									gymId,
									itemId,
									date,
									captcha,
									field.id,
									true,
								)
								.then(() => {
									navigation.replace("SportsSuccess", {
										...params,
										phone: phoneNumber,
									});
									helper
										.getSportsReservationRecords()
										.then((r) => dispatch(setActiveSportsReservationRecord(r)));
								})
								.catch((e) => {
									Snackbar.show({
										text:
											typeof e.message === "string"
												? e.message
												: getStr("networkRetry"),
										duration: Snackbar.LENGTH_LONG,
									});
								})
								.then(() => setProcessing(false));
						}
					}}
					disabled={
						field === undefined ||
						processing ||
						(!helper.mocked() &&
							(captcha.trim().length === 0 || phoneNumber.trim().length === 0))
					}>
					<Text
						style={{
							color: "white",
							fontWeight: "400",
							fontSize: 20,
							lineHeight: 24,
						}}>
						{getStr("submitOrder")}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
