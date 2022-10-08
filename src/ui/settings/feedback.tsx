import {
	GestureResponderEvent,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import React, {useEffect, useState} from "react";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import Snackbar from "react-native-snackbar";
import {useColorScheme} from "react-native";
import {
	getFeedbackReplies,
	getWeChatGroupQRCodeContent,
	submitFeedback,
} from "../../utils/webApi";
import {
	SettingsItem,
	SettingsMiddleText,
	SettingsSeparator,
} from "../../components/settings/items";
import QRCode from "react-native-qrcode-svg";
import themes from "../../assets/themes/themes";

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
				backgroundColor: theme.colors.themeBackground,
				flex: 1,
				margin: 4,
				borderRadius: 4,
			}}
			disabled={disabled}
			onPress={(e) => !disabled && onPress(e)}>
			<Text
				style={{textAlign: "center", padding: 10, color: theme.colors.text}}>
				{getStr(text)}
			</Text>
		</TouchableOpacity>
	);
};

type AsyncReturnType<T extends (...args: any) => any> = T extends (
	...args: any
) => Promise<infer U>
	? U
	: T extends (...args: any) => infer U
	? U
	: any;

export const FeedbackScreen = ({navigation}: {navigation: RootNav}) => {
	const [text, setText] = useState("");
	const [contact, setContact] = useState("");
	const [qrcodeContent, setQrcodeContent] = useState<string>();
	const [feedbackData, setFeedbackData] = useState<
		AsyncReturnType<typeof getFeedbackReplies>
	>([]);
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	useEffect(() => {
		getFeedbackReplies().then(setFeedbackData);
		getWeChatGroupQRCodeContent().then(setQrcodeContent);
	}, []);

	return (
		<ScrollView style={{flex: 1, marginHorizontal: 12}}>
			<Text style={{fontSize: 20, marginLeft: 30, fontWeight: "bold"}}>
				{getStr("askBox")}
			</Text>
			{feedbackData.slice(0, 5).map(({question}) => (
				<SettingsItem
					key={question}
					text={question}
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
			<View
				style={{backgroundColor: colors.themeBackground, alignItems: "center"}}>
				{qrcodeContent !== undefined && (
					<>
						<QRCode value={qrcodeContent} size={80} />
						<Text style={{marginTop: 6, color: "grey"}}>
							{getStr("wechatPrompt")}
						</Text>
					</>
				)}
			</View>
			<Text
				style={{
					textAlign: "center",
					fontSize: 20,
					fontWeight: "bold",
					color: colors.fontB1,
				}}>
				{getStr("submitFeedbackWithMobileData")}
			</Text>
			<TextInput
				value={text}
				onChangeText={setText}
				style={{
					textAlignVertical: "top",
					fontSize: 15,
					marginTop: 12,
					padding: 12,
					backgroundColor: colors.themeBackground,
					color: colors.text,
					borderColor: colors.inputBorder,
					borderWidth: 1,
					borderRadius: 5,
				}}
				placeholder={getStr("feedbackHint")}
				placeholderTextColor={colors.fontB3}
				multiline={true}
			/>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
				}}>
				<TextInput
					value={contact}
					onChangeText={setContact}
					style={{
						flex: 3,
						textAlignVertical: "top",
						fontSize: 15,
						marginVertical: 8,
						padding: 12,
						backgroundColor: colors.themeBackground,
						color: colors.text,
						borderColor: colors.inputBorder,
						borderWidth: 1,
						borderRadius: 5,
					}}
					placeholder={getStr("contact")}
					placeholderTextColor={colors.fontB3}
				/>
				<BottomButton
					text="submit"
					onPress={() => {
						submitFeedback(text, contact)
							.then(() =>
								Snackbar.show({
									text: getStr("feedbackSuccess"),
									duration: Snackbar.LENGTH_SHORT,
								}),
							)
							.catch(() =>
								Snackbar.show({
									text: getStr("networkRetry"),
									duration: Snackbar.LENGTH_SHORT,
								}),
							);
					}}
					disabled={text.length === 0}
				/>
			</View>
			<BottomButton
				text="feishuFeedback"
				onPress={() => {
					navigation.navigate("FeishuFeedback");
				}}
				disabled={false}
			/>
		</ScrollView>
	);
};
