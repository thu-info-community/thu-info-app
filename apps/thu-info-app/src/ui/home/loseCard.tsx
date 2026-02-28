import {getStr} from "../../utils/i18n";
import {Text, useColorScheme, View} from "react-native";
import {helper} from "../../redux/store";
import {Snackbar} from "react-native-snackbar";
import themes from "../../assets/themes/themes";
import IconExclamation from "../../assets/icons/IconExclamation";
import {BottomPopupTriggerView, RoundedView} from "../../components/views";
import {NetworkRetry} from "../../components/easySnackbars";
import {
	CodeField,
	Cursor,
	useClearByFocusCell,
} from "react-native-confirmation-code-field";
import {useState} from "react";

const EnterPin = ({
	pin,
	setPin,
}: {
	pin: string;
	setPin: (text: string) => void;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [props, getCellOnLayoutHandler] = useClearByFocusCell({
		value: pin,
		setValue: setPin,
	});
	return (
		<CodeField
			{...props}
			value={pin}
			onChangeText={(text) => {
				if (text.match(/^\d{0,6}$/)) {
					setPin(text);
				}
			}}
			cellCount={6}
			rootStyle={{margin: 16}}
			keyboardType="number-pad"
			textContentType="oneTimeCode"
			secureTextEntry={true}
			renderCell={({index, symbol, isFocused}) => (
				<View
					key={index}
					style={{
						width: 42,
						height: 56,
						paddingHorizontal: 12,
						paddingVertical: 8,
						borderWidth: 2,
						borderColor: isFocused ? colors.mainTheme : colors.themeGrey,
						borderRadius: 8,
						justifyContent: "center",
						marginLeft: index === 0 ? 0 : 6,
					}}>
					<Text
						style={{
							fontSize: 24,
							textAlign: "center",
							color: colors.primaryLight,
						}}
						onLayout={getCellOnLayoutHandler(index)}>
						{symbol ? "*" : isFocused ? <Cursor /> : null}
					</Text>
				</View>
			)}
		/>
	);
};

export const LoseCardScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [pin, setPin] = useState("");

	return (
		<View
			style={{
				flex: 1,
				marginHorizontal: 12,
				marginTop: 16,
				backgroundColor: colors.contentBackground,
				alignItems: "center",
			}}>
			<View style={{marginTop: 56}}>
				<IconExclamation width={128} height={128} />
			</View>
			<BottomPopupTriggerView
				style={{marginTop: 64}}
				popupTitle={getStr("enterCardPin")}
				popupContent={<EnterPin pin={pin} setPin={setPin} />}
				popupCanFulfill={pin.length === 6}
				popupOnFulfilled={() => {
					helper
						.reportCampusCardLoss(pin)
						.then(() =>
							Snackbar.show({
								text: getStr("success"),
								duration: Snackbar.LENGTH_SHORT,
							}),
						)
						.catch(NetworkRetry);
					setPin("");
				}}
				popupOnCancelled={() => {
					setPin("");
				}}>
				<RoundedView
					style={{
						backgroundColor: colors.statusWarning,
						paddingVertical: 8,
						paddingHorizontal: 36,
						borderRadius: 4,
					}}>
					<Text style={{color: colors.contentBackground, fontSize: 20}}>
						{getStr("loseCardButton")}
					</Text>
				</RoundedView>
			</BottomPopupTriggerView>
			<Text
				style={{
					color: colors.text,
					fontSize: 14,
					marginHorizontal: 92,
					marginTop: 36,
					textAlign: "center",
				}}>
				{getStr("loseCardHint")}
			</Text>
			<BottomPopupTriggerView
				style={{marginTop: 64}}
				popupTitle={getStr("enterCardPin")}
				popupContent={<EnterPin pin={pin} setPin={setPin} />}
				popupCanFulfill={pin.length === 6}
				popupOnFulfilled={() => {
					helper
						.cancelCampusCardLoss(pin)
						.then(() =>
							Snackbar.show({
								text: getStr("success"),
								duration: Snackbar.LENGTH_SHORT,
							}),
						)
						.catch(NetworkRetry);
					setPin("");
				}}
				popupOnCancelled={() => {
					setPin("");
				}}>
				<Text style={{color: colors.primaryLight, fontSize: 18}}>
					{getStr("cancelLossReport")}
				</Text>
			</BottomPopupTriggerView>
		</View>
	);
};
