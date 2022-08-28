import {TextInput, View, Text, Image, TouchableOpacity} from "react-native";
import React, {useState} from "react";
import {helper} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import themedStyles from "../../utils/themedStyles";
import themes from "../../assets/themes/themes";
import Icon from "react-native-vector-icons/FontAwesome";
import {useColorScheme} from "react-native";
import {RootNav} from "../../components/Root";
import {NetworkRetry} from "../../components/easySnackbars";
import Snackbar from "react-native-snackbar";
import {CabError} from "thu-info-lib/dist/utils/error";
import IconLibRoom from "../../assets/icons/IconLibRoom";
import {uFetch} from "thu-info-lib/dist/utils/network";

export const LibRoomCaptchaScreen = ({navigation}: {navigation: RootNav}) => {
	const [captcha, setCaptcha] = React.useState("");
	const [processing, setProcessing] = React.useState(false);
	const [imageBase64, setImageBase64] = useState<string>();

	React.useEffect(() => {
		helper.getLibraryRoomBookingCaptchaUrl().then(uFetch).then(setImageBase64);
	}, []);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	return (
		<View style={style.container}>
			<IconLibRoom width={80} height={80} />
			<View style={{height: 20}} />
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<Icon name="user" size={18} color={theme.colors.primary} />
				<TextInput
					style={style.textInputStyle}
					placeholderTextColor={theme.colors.primary}
					selectionColor={theme.colors.accent}
					value={helper.userId}
					editable={false}
				/>
			</View>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<Icon name="key" size={18} color={theme.colors.primary} />
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("captcha")}
					placeholderTextColor={theme.colors.primary}
					selectionColor={theme.colors.accent}
					value={captcha}
					onChangeText={(text) => setCaptcha(text.toUpperCase())}
				/>
			</View>
			<TouchableOpacity
				onPress={() =>
					helper
						.getLibraryRoomBookingCaptchaUrl()
						.then(uFetch)
						.then(setImageBase64)
				}>
				<Image
					source={{uri: `data:image/jpg;base64,${imageBase64}`}}
					style={{height: 50, width: 200}}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={style.loginButtonStyle}
				disabled={processing}
				onPress={() => {
					setProcessing(true);
					Snackbar.show({
						text: getStr("processing"),
						duration: Snackbar.LENGTH_SHORT,
					});
					helper
						.loginLibraryRoomBooking(captcha)
						.then(() => navigation.pop())
						.catch((e) => {
							if (e instanceof CabError) {
								Snackbar.show({
									text: e.message,
									duration: Snackbar.LENGTH_LONG,
								});
							} else {
								NetworkRetry();
							}
							helper
								.getLibraryRoomBookingCaptchaUrl()
								.then(uFetch)
								.then(setImageBase64);
						})
						.then(() => setProcessing(false));
				}}>
				<Text style={style.loginButtonTextStyle}>{getStr("confirm")}</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = themedStyles((theme) => {
	return {
		container: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},

		textInputStyle: {
			color: theme.colors.primary,
			width: "36%",
			textAlign: "left",
			marginHorizontal: 10,
			padding: 10,
		},

		loginButtonStyle: {
			height: 35,
			width: 100,
			backgroundColor: theme.colors.accent,
			marginTop: 30,
			marginBottom: 20,
			justifyContent: "center",
			alignItems: "center",
			borderRadius: 8,
		},

		loginButtonTextStyle: {
			color: "white",
			fontWeight: "bold",
		},

		credentialNoteStyle: {
			color: theme.colors.primaryDark,
			marginHorizontal: 40,
			marginTop: 20,
		},
	};
});
