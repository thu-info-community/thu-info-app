import {RootNav} from "../../components/Root.tsx";
import {
	Image,
	Platform,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {KeyboardAvoidingView} from "react-native";
import * as Theme from "../../assets/themes/themes.ts";
import {helper} from "../../redux/store.ts";
import {useEffect, useState} from "react";
import {RoundedView} from "../../components/views.tsx";
import {
	CodeField,
	Cursor,
	useClearByFocusCell,
} from "react-native-confirmation-code-field";
import {getStr} from "../../utils/i18n.ts";
import Snackbar from "react-native-snackbar";
import {RefreshControl, ScrollView} from "react-native-gesture-handler";
import {uFetch} from "@thu-info/lib/src/utils/network";

export const NetworkLoginScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const colors = Theme.default(themeName).colors;
	const [verificationCode, setVerificationCode] = useState("");
	const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
	const [refreshing, setRefreshing] = useState(false);

	const refresh = () => {
		setRefreshing(true);
		helper.getNetworkVerificationImageUrl().then((url) => {
			uFetch(url).then((base64) => {
				setImageUrl(`data:image/png;base64,${base64}`);
			});
			setRefreshing(false);
		});
	};

	useEffect(() => {
		helper.getNetworkVerificationImageUrl().then((url) => {
			uFetch(url).then((base64) => {
				setImageUrl(`data:image/png;base64,${base64}`);
			});
		});
	}, []);

	const [props, getCellOnLayoutHandler] = useClearByFocusCell({
		value: verificationCode,
		setValue: setVerificationCode,
	});

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[colors.accent]}
						progressBackgroundColor={colors.contentBackground}
					/>
				}>
				<RoundedView
					style={{
						borderRadius: 24,
						alignItems: "center",
						justifyContent: "center",
						margin: 24,
						padding: 24,
						paddingVertical: 24,
						backgroundColor: colors.contentBackground,
						display: "flex",
						flexDirection: "column",
						gap: 24,
					}}>
					<Text
						style={{
							fontSize: 24,
							color: colors.text,
						}}>
						{getStr("networkVerificationCode")}
					</Text>
					<View
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
							justifyContent: "center",
						}}>
						<TouchableOpacity
							onPress={() => {
								helper.getNetworkVerificationImageUrl().then((url) => {
									uFetch(url).then((base64) => {
										setImageUrl(`data:image/png;base64,${base64}`);
									});
								});
							}}>
							<Image
								source={{
									uri: imageUrl,
									cache: "reload",
								}}
								width={180}
								height={68}
								style={{
									backgroundColor: "white",
									borderRadius: 12,
								}}
							/>
						</TouchableOpacity>
						<Text
							style={{
								fontSize: 14,
								color: colors.fontB3,
							}}>
							{getStr("networkVerificationCodeRefreshHint")}
						</Text>
					</View>
					<CodeField
						{...props}
						value={verificationCode}
            onChangeText={(v) => {
              if (refreshing) {
                return;
              }
							if (v.match(/^\d{0,4}$/)) {
								setVerificationCode(v);
								if (v.length === 4) {
									setRefreshing(true);
									helper
										.loginUsereg(v)
										.then(() => {
											setRefreshing(false);
											navigation.pop();
										})
										.catch((e) => {
											setRefreshing(false);
											setVerificationCode("");
											Snackbar.show({
												text: e.message,
												duration: Snackbar.LENGTH_SHORT,
											});
										});
								}
							}
						}}
						cellCount={4}
						autoFocus={false}
						keyboardType="number-pad"
						textContentType="oneTimeCode"
						secureTextEntry={false}
						renderCell={({index, symbol, isFocused}) => (
							<View
								key={index}
								style={{
									width: "12.5%",
									aspectRatio: 0.67,
									paddingHorizontal: "auto",
									paddingVertical: "auto",
									borderWidth: 2,
									borderColor: isFocused ? colors.mainTheme : colors.themeGrey,
									borderRadius: 12,
									justifyContent: "center",
									marginLeft: index === 0 ? 0 : 20,
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
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
