import {
	GestureResponderEvent,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import Snackbar from "react-native-snackbar";
import {useColorScheme} from "react-native";
import {
	SettingsItem,
	SettingsMiddleText,
	SettingsSeparator,
} from "../../components/settings/items";
import QRCode from "react-native-qrcode-svg";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import VersionNumber from "react-native-version-number";
import {Feedback} from "@thu-info/lib/src/models/app/feedback";
import {NetworkRetry} from "../../components/easySnackbars.ts";

const BottomButton = ({
	text,
	onPress,
	disabled,
}: {
	text: keyof typeof zh;
	onPress: (event: GestureResponderEvent) => void;
	disabled: boolean;
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<TouchableOpacity
			style={{
				backgroundColor: theme.colors.themePurple,
				flex: 1,
				margin: 4,
				borderRadius: 4,
			}}
			disabled={disabled}
			onPress={(e) => !disabled && onPress(e)}>
			<Text
				style={{
					textAlign: "center",
					padding: 10,
					color: theme.colors.contentBackground,
				}}>
				{getStr(text)}
			</Text>
		</TouchableOpacity>
	);
};

export const FeedbackScreen = ({navigation}: {navigation: RootNav}) => {
	const [text, setText] = useState("");
	const [contact, setContact] = useState("");
	const [qrcodeContent, setQrcodeContent] = useState<string>();
	const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
	const [processing, setProcessing] = useState(false);
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	useEffect(() => {
		helper.getFeedbackReplies().then(setFeedbackData).catch(NetworkRetry);
		helper
			.getWeChatGroupQRCodeContent()
			.then(setQrcodeContent)
			.catch(NetworkRetry);
	}, []);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{flex: 1}}>
			<ScrollView style={{marginHorizontal: 12}}>
				<Text style={{fontSize: 20, marginLeft: 30, fontWeight: "bold"}}>
					{getStr("askBox")}
				</Text>
				{feedbackData.slice(0, 5).map(({content}) => (
					<SettingsItem
						key={content}
						text={content}
						onPress={() => navigation.navigate("Popi")}
						icon={undefined}
						normalText={true}
					/>
				))}
				<SettingsMiddleText
					text={getStr("more")}
					onPress={() => navigation.navigate("Popi")}
				/>
				<SettingsSeparator />
				{qrcodeContent !== undefined && !helper.mocked() && (
					<View
						style={{
							backgroundColor: colors.themeBackground,
							alignItems: "center",
							flexDirection: "row",
						}}>
						<View style={{flex: 1}} />
						<QRCode
							value={qrcodeContent}
							size={100}
							onError={console.error}
							backgroundColor={colors.themeBackground}
							color={colors.text}
						/>
						<Text style={{margin: 12, color: colors.text}}>
							{getStr("wechatPrompt")}
						</Text>
						<View style={{flex: 1}} />
					</View>
				)}
				<BottomButton
					text="feishuFeedback"
					onPress={() => {
						navigation.navigate("FeishuFeedback");
					}}
					disabled={false}
				/>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
