import {useState} from "react";
import {
	Alert,
	Animated,
	Modal,
	Pressable,
	SectionList,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {KeyboardAvoidingScreen} from "../keyboardAvoidingScreen";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import type {Conversation} from "../../ui/home/deepseek";

const HISTORY_DRAWER_WIDTH = 320;
type DeepSeekColors = ReturnType<typeof themes>["colors"];

export const DeepSeekHistoryDrawer = ({
	visible,
	position,
	history,
	conversation,
	colors,
	onClose,
	onCreate,
	onDeleteAll,
	onSelect,
	onDelete,
}: {
	visible: boolean;
	position: Animated.Value;
	history: Conversation[];
	conversation: Conversation;
	colors: DeepSeekColors;
	onClose: () => void;
	onCreate: () => void;
	onDeleteAll: () => void;
	onSelect: (conversation: Conversation) => void;
	onDelete: (conversation: Conversation) => void;
}) => {
	const [searchKey, setSearchKey] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [drawerWidth, setDrawerWidth] = useState(0);
	const insets = useSafeAreaInsets();
	const sections = Object.entries(
		history.reduce(
			(acc, item) => {
				const date = new Date(item.timestamp ?? 0).toLocaleDateString();
				if (!acc[date]) {
					acc[date] = [];
				}
				acc[date].push(item);
				return acc;
			},
			{} as Record<string, Conversation[]>,
		),
	)
		.sort(
			([dateA], [dateB]) =>
				new Date(dateB).getTime() - new Date(dateA).getTime(),
		)
		.map(([date, data]) => ({
			title: date,
			data,
		}));
	const requestDeleteConversation = (item: Conversation) => {
		setDeleteId(item.id);
		Alert.alert(
			getStr("delete"),
			getStr("deleteConversationConfirm"),
			[
				{
					text: getStr("cancel"),
					style: "cancel",
					onPress: () => {
						setDeleteId(null);
					},
				},
				{
					text: getStr("confirm"),
					onPress: () => {
						onDelete(item);
						setDeleteId(null);
						onClose();
					},
				},
			],
			{
				cancelable: true,
				onDismiss: () => {
					setDeleteId(null);
				},
			},
		);
	};

	return (
		<Modal visible={visible} transparent onRequestClose={() => onClose()}>
			<KeyboardAvoidingScreen keyboardVerticalOffset={0}>
				<Pressable
					style={{
						position: "absolute",
						end: 0,
						top: 0,
						width: "100%",
						height: "100%",
					}}
					onPress={() => onClose()}>
					<Animated.View
						style={{
							flex: 1,
							opacity: position.interpolate({
								inputRange: [-1, 0],
								outputRange: [0, 0.75],
							}),
							backgroundColor: colors.themeBackground,
						}}
					/>
				</Pressable>
				<Animated.View
					onLayout={({nativeEvent}) => setDrawerWidth(nativeEvent.layout.width)}
					style={{
						position: "absolute",
						top: 0,
						transform: [
							{
								translateX: position.interpolate({
									inputRange: [-1, 0],
									outputRange: [-drawerWidth, 0],
								}),
							},
						],
						backgroundColor: colors.contentBackground,
						paddingHorizontal: 16,
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
						width: "62%",
						maxWidth: HISTORY_DRAWER_WIDTH,
						height: "100%",
					}}>
					<View
						style={{
							flex: 0,
							flexDirection: "row",
							alignItems: "center",
						}}>
						<TextInput
							value={searchKey}
							onChangeText={setSearchKey}
							style={{
								flex: 1,
								textAlignVertical: "center",
								fontSize: 14,
								marginVertical: 4,
								paddingVertical: 4,
								paddingHorizontal: 12,
								backgroundColor: colors.themeBackground,
								color: colors.text,
								borderColor: colors.themePurple,
								borderWidth: 1.5,
								borderRadius: 18,
							}}
							placeholder={getStr("search")}
							placeholderTextColor={colors.fontB3}
						/>
					</View>
					<Text style={{color: colors.fontB2, margin: 4, marginTop: 8}}>
						{getStr("deepseekLocalStorageNotice")}
					</Text>
					<SectionList
						style={{flex: 1, marginTop: 8}}
						sections={sections}
						renderItem={({item}) => (
							<Pressable
								style={{
									padding: 8,
									marginStart: 4,
									backgroundColor:
										deleteId === item.id
											? colors.statusWarningOpacity
											: item.timestamp === conversation.timestamp
												? colors.themeTransparentGrey
												: colors.contentBackground,
									borderRadius: 8,
								}}
								onPress={() => {
									onSelect(item);
									onClose();
								}}
								onLongPress={() => requestDeleteConversation(item)}>
								<Text style={{color: colors.text}}>{item.title}</Text>
							</Pressable>
						)}
						renderSectionHeader={({section: {title}}) => (
							<Text
								style={{
									color: colors.fontB2,
									backgroundColor: colors.contentBackground,
									paddingVertical: 4,
								}}>
								{title}
							</Text>
						)}
						keyExtractor={(item) => item.id}
					/>
					<TouchableOpacity
						style={{
							paddingVertical: 12,
							marginTop: 8,
							borderRadius: 12,
							backgroundColor: colors.themeTransparentGrey,
						}}
						onPress={onCreate}>
						<Text style={{color: colors.text, textAlign: "center"}}>
							{getStr("newConversation")}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={{
							paddingVertical: 12,
							marginTop: 8,
							borderRadius: 12,
							backgroundColor: colors.statusWarningOpacity,
						}}
						onPress={onDeleteAll}>
						<Text style={{color: colors.statusWarning, textAlign: "center"}}>
							{getStr("delete") + getStr("all")}
						</Text>
					</TouchableOpacity>
				</Animated.View>
			</KeyboardAvoidingScreen>
		</Modal>
	);
};
