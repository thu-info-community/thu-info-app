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
	useWindowDimensions,
	View,
} from "react-native";
import {RootNav, SportsSelectProp} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {styles} from "../../ui/settings/settings";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import {Snackbar} from "react-native-snackbar";
import {RoundedView} from "../../components/views";
import {PrimaryButton} from "../../components/subpage/buttons";
import IconRight from "../../assets/icons/IconRight";
import {SportsIdInfo} from "@thu-info/lib/src/models/home/sports";
import {setActiveSportsReservationRecord} from "../../redux/slices/reservation";
import {uFetch} from "@thu-info/lib/src/utils/network";
import {useDispatch} from "react-redux";
import {scaledLineHeight} from "../../utils/scaledText";

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
	const {fontScale} = useWindowDimensions();

	const dispatch = useDispatch();

	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const style = styles(themeName);

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
								flexShrink: 0,
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{getStr("gym")}
						</Text>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								flex: 1,
								minWidth: 0,
								textAlign: "right",
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{name}
						</Text>
					</View>
					<View
						style={[
							style.separator,
							{
								marginHorizontal: 0,
							},
						]}
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
								flexShrink: 0,
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{getStr("date")}
						</Text>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								flex: 1,
								minWidth: 0,
								textAlign: "right",
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{date}
						</Text>
					</View>
					<View
						style={[
							style.separator,
							{
								marginHorizontal: 0,
							},
						]}
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
								flexShrink: 0,
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{getStr("duration")}
						</Text>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								flex: 1,
								minWidth: 0,
								textAlign: "right",
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{period}
						</Text>
					</View>
					<View
						style={[
							style.separator,
							{
								marginHorizontal: 0,
							},
						]}
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
								flexShrink: 0,
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{getStr("field")}
						</Text>
						<View
							style={{
								flex: 1,
								minWidth: 0,
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "flex-end",
							}}>
							<Text
								style={{
									color: colors.fontB3,
									fontSize: 16,
									flexShrink: 1,
									minWidth: 0,
									textAlign: "right",
									lineHeight: scaledLineHeight(24, fontScale),
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
								flexShrink: 0,
								lineHeight: scaledLineHeight(24, fontScale),
							}}>
							{getStr("phoneNumber")}
						</Text>
						<TextInput
							style={{
								color: colors.text,
								padding: 0,
								fontSize: 16,
								flex: 1,
								minWidth: 0,
								lineHeight: scaledLineHeight(24, fontScale),
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
								lineHeight: scaledLineHeight(24, fontScale),
							}}
							value={captcha}
							onChangeText={setCaptcha}
							placeholder={getStr("captchaCaseSensitive")}
							placeholderTextColor={colors.fontB3}
						/>
						<View
							style={[
								style.separator,
								{
									marginHorizontal: 0,
								},
							]}
						/>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								rowGap: 8,
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
										lineHeight: scaledLineHeight(24, fontScale),
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
				<PrimaryButton
					text={getStr("submitOrder")}
					style={{alignSelf: "flex-end", margin: 12}}
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
					}
				/>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
