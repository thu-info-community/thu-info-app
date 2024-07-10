import {View, Text, TouchableOpacity} from "react-native";
import {useEffect, useState} from "react";
import {futures} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import {styles} from "./settings";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {RootNav, TwoFactorAuthRouteProp} from "../../components/Root";
import {RoundedView} from "../../components/views.tsx";
import IconCheck from "../../assets/icons/IconCheck.tsx";
import {
	CodeField,
	Cursor,
	useClearByFocusCell,
} from "react-native-confirmation-code-field";

export const TwoFactorAuthScreen = ({
	navigation,
	route: {params},
}: {
	navigation: RootNav;
	route: TwoFactorAuthRouteProp;
}) => {
	const [method, setMethod] = useState<"wechat" | "mobile" | undefined>(
		undefined,
	);
	const [captcha, setCaptcha] = useState("");
	const [props, getCellOnLayoutHandler] = useClearByFocusCell({
		value: captcha,
		setValue: setCaptcha,
	});
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const {colors} = theme;
	const style = styles(themeName);

	useEffect(() => {
		return () => {
			futures.twoFactorMethodFuture?.(undefined);
			futures.twoFactorAuthFuture?.(undefined);
		};
	}, []);

	return (
		<View style={{flex: 1, padding: 12}}>
			<Text style={{marginLeft: 8, color: colors.fontB2, marginTop: 12}}>
				{getStr("twoFactorPrompt")}
			</Text>
			<RoundedView style={style.rounded}>
				{params.hasWeChatBool && (
					<TouchableOpacity
						style={style.touchable}
						disabled={method !== undefined}
						onPress={() => {
							setMethod("wechat");
							futures.twoFactorMethodFuture?.("wechat");
							futures.twoFactorMethodFuture = undefined;
						}}>
						<Text style={style.text}>{getStr("twoFactorWechat")}</Text>
						{method === "wechat" && <IconCheck width={18} height={18} />}
					</TouchableOpacity>
				)}
				<View style={style.separator} />
				{params.phone !== null && (
					<TouchableOpacity
						style={style.touchable}
						disabled={method !== undefined}
						onPress={() => {
							setMethod("mobile");
							futures.twoFactorMethodFuture?.("mobile");
							futures.twoFactorMethodFuture = undefined;
						}}>
						<Text style={style.text}>
							{getStr("twoFactorMobile").format(params.phone.toString())}
						</Text>
						{method === "mobile" && <IconCheck width={18} height={18} />}
					</TouchableOpacity>
				)}
			</RoundedView>
			{method !== undefined && (
				<RoundedView
					style={{
						width: "100%",
						alignItems: "center",
						marginVertical: 16,
						borderRadius: 20,
					}}>
					<Text style={{color: colors.text, margin: 16, fontSize: 20}}>
						{getStr("captcha")}
					</Text>
					<CodeField
						{...props}
						value={captcha}
						onChangeText={(v) => {
							if (v.match(/^\d{0,6}$/)) {
								setCaptcha(v);
								if (v.length === 6) {
									futures.twoFactorAuthFuture?.(v);
									futures.twoFactorAuthFuture = undefined;
									navigation.pop();
								}
							}
						}}
						cellCount={6}
						autoFocus={false}
						keyboardType="number-pad"
						textContentType="oneTimeCode"
						secureTextEntry={false}
						renderCell={({index, symbol, isFocused}) => (
							<View
								key={index}
								style={{
									width: 55,
									height: 73,
									paddingHorizontal: 12,
									paddingVertical: 8,
									borderWidth: 2,
									borderColor: isFocused ? colors.mainTheme : colors.themeGrey,
									borderRadius: 12,
									justifyContent: "center",
									marginLeft: index === 0 ? 0 : 12,
								}}>
								<Text
									style={{
										fontSize: 32,
										textAlign: "center",
										color: colors.primaryLight,
									}}
									onLayout={getCellOnLayoutHandler(index)}>
									{symbol ? symbol : isFocused ? <Cursor /> : null}
								</Text>
							</View>
						)}
					/>
				</RoundedView>
			)}
		</View>
	);
};
