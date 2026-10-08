import {Fragment, useEffect, useState} from "react";
import {Platform, Text, TouchableOpacity, useColorScheme, View} from "react-native";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import {Snackbar} from "react-native-snackbar";
import {ThemedTextInput} from "../../components/subpage/fields";
import {EmptyState, Separator} from "../../components/subpage/rows";
import {SectionCard, SubPageScreen} from "../../components/subpage/containers";
import {PrimaryButton} from "../../components/subpage/buttons";
import {radius, spacing} from "../../components/subpage/tokens";
import QRCode from "react-native-qrcode-svg";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import VersionNumber from "react-native-version-number";
import DeviceInfo from "react-native-device-info";
import {Feedback} from "@thu-info/lib/src/models/app/feedback";
import {NetworkRetry} from "../../components/easySnackbars";
import {formatTimestamp} from "../../utils/time";

const replyAttribution = ({replierName, repliedTime}: Feedback) =>
	[replierName, formatTimestamp(repliedTime)].filter((s) => !!s).join(" · ");

const BottomButton = ({
	text,
	onPress,
	disabled,
	grow,
}: {
	text: keyof typeof zh;
	onPress: () => void;
	disabled: boolean;
	/**
	 * Fill the remaining width. Only for a button sharing a row with a field:
	 * as a plain child of the page's column the same `flex: 1` makes the button
	 * absorb the page's free vertical space, which on the first frame — before
	 * the slow sections land — is most of the screen.
	 */
	grow?: boolean;
}) => {
	return (
		<PrimaryButton
			text={getStr(text)}
			onPress={onPress}
			disabled={disabled}
			style={grow ? {flex: 1} : undefined}
		/>
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
		<SubPageScreen keyboard>
			<SectionCard title={getStr("askBox")}>
				{feedbackData.length === 0 ? (
					<EmptyState title={getStr("popiEmpty")} />
				) : (
					<>
						{feedbackData
							.slice(0, 5)
							.map((item, index) => {
								const attribution = replyAttribution(item);
								return (
									<Fragment key={`${index}:${item.content.slice(0, 32)}`}>
										{index > 0 && <Separator style={{marginHorizontal: 0}} />}
										<TouchableOpacity
											accessibilityRole="button"
											onPress={() => navigation.navigate("Popi")}
											style={{paddingVertical: spacing.sm}}>
											<Text
												numberOfLines={2}
												style={{color: colors.text, fontSize: 16}}>
												{item.content}
											</Text>
											{attribution.length > 0 ? (
												<Text
													style={{
														color: colors.fontB3,
														fontSize: 13,
														marginTop: spacing.xs,
													}}>
													{attribution}
												</Text>
											) : null}
										</TouchableOpacity>
									</Fragment>
								);
							})}
						<Separator style={{marginHorizontal: 0}} />
						<TouchableOpacity
							accessibilityRole="button"
							onPress={() => navigation.navigate("Popi")}
							style={{paddingVertical: spacing.sm}}>
							<Text style={{color: colors.primaryLight, fontSize: 16}}>
								{getStr("more")}
							</Text>
						</TouchableOpacity>
					</>
				)}
			</SectionCard>
			{qrcodeContent !== undefined && (
				<SectionCard>
					<View style={{alignItems: "center"}}>
						<QRCode
							value={qrcodeContent}
							size={100}
							onError={console.error}
							backgroundColor={colors.contentBackground}
							color={colors.text}
						/>
						<Text
							style={{
								marginTop: spacing.md,
								color: colors.text,
								textAlign: "center",
							}}>
							{getStr("wechatPrompt")}
						</Text>
					</View>
				</SectionCard>
			)}
			<SectionCard>
				<ThemedTextInput
					value={text}
					onChangeText={setText}
					style={{
						textAlignVertical: "top",
						minHeight: 96,
						fontSize: 15,
						padding: spacing.md,
						backgroundColor: colors.themeBackground,
						borderColor: colors.inputBorder,
						borderWidth: 1,
						borderRadius: radius.control,
					}}
					placeholder={getStr("feedbackHint")}
					multiline={true}
				/>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginTop: spacing.md,
					}}>
					<ThemedTextInput
						value={contact}
						onChangeText={setContact}
						style={{
							flex: 3,
							textAlignVertical: "center",
							fontSize: 15,
							marginEnd: spacing.sm,
							paddingHorizontal: spacing.md,
							paddingVertical: spacing.md - 1, // minus border width
							backgroundColor: colors.themeBackground,
							borderColor: colors.inputBorder,
							borderWidth: 1,
							borderRadius: radius.control,
						}}
						placeholder={getStr("contact")}
					/>
					<BottomButton
						grow
						text="submit"
						onPress={() => {
							setProcessing(true);
							helper
								.submitFeedback(
									text,
									`${VersionNumber.appVersion} (${VersionNumber.buildVersion})`,
									`${Platform.OS} ${Platform.Version}`,
									"",
									contact,
									DeviceInfo.getModel(),
								)
								.then(() =>
									Snackbar.show({
										text: getStr("feedbackSuccess"),
										duration: Snackbar.LENGTH_SHORT,
									}),
								)
								.then(() => setText(""))
								.catch(() =>
									Snackbar.show({
										text: getStr("networkRetry"),
										duration: Snackbar.LENGTH_SHORT,
									}),
								)
								.then(() => setProcessing(false));
						}}
						disabled={text.length === 0 || processing}
					/>
				</View>
			</SectionCard>
			<BottomButton
				text="feishuFeedback"
				onPress={() => {
					navigation.navigate("FeishuFeedback");
				}}
				disabled={false}
			/>
		</SubPageScreen>
	);
};
