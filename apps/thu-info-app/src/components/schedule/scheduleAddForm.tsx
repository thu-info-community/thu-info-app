import {ComponentProps, ReactNode} from "react";
import {
	Modal,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	useColorScheme,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import {State} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import {KeyboardAvoidingScreen} from "../keyboardAvoidingScreen";
import {RoundedView} from "../views";

export const useScheduleFormColors = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const darkMode = useSelector((s: State) => s.config.darkMode);
	const light = !(darkMode || themeName === "dark");
	return {
		...colors,
		background: light ? "#F8F6F2" : colors.contentBackground,
		card: light ? "#FDFBF7" : colors.contentBackground,
		selectedTab: light ? "#8B6B9C" : colors.inputBorder,
		unselectedTab: light ? "#F0EEEA" : colors.themeBackground,
		selectedTabText: light ? "#FFFFFF" : colors.fontB1,
		unselectedTabText: light ? "#5C5A56" : colors.fontB1,
		formText: light ? "#5C5A56" : colors.fontB1,
		formTitle: light ? "#2C2A28" : colors.text,
	};
};

export type ScheduleFormColors = ReturnType<typeof useScheduleFormColors>;
type ColoredProps = {colors: ScheduleFormColors};

const ScheduleFormHeader = ({
	colors,
	editing,
	valid,
	onClose,
	onSave,
}: ColoredProps & {
	editing: boolean;
	valid: boolean;
	onClose: () => void;
	onSave: () => void;
}) => (
	<View
		style={{
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: 20,
			paddingVertical: 14,
			borderBottomWidth: 1,
			borderBottomColor: colors.themeGrey,
		}}>
		<TouchableOpacity
			onPress={onClose}
			style={{paddingHorizontal: 8, paddingVertical: 4}}>
			<Text style={{color: colors.formText, fontSize: 16, fontWeight: "600"}}>
				{getStr("cancel")}
			</Text>
		</TouchableOpacity>
		<Text style={{color: colors.formTitle, fontSize: 18, fontWeight: "700"}}>
			{getStr(editing ? "scheduleEdit" : "scheduleAddCustom")}
		</Text>
		<TouchableOpacity
			disabled={!valid}
			onPress={onSave}
			style={{
				opacity: valid ? 1 : 0.5,
				paddingHorizontal: 8,
				paddingVertical: 4,
			}}>
			<Text
				style={{
					color: valid ? "#5B8C7C" : colors.themeGrey,
					fontSize: 16,
					fontWeight: "600",
				}}>
				{getStr("save")}
			</Text>
		</TouchableOpacity>
	</View>
);

export const ScheduleFormModal = ({
	visible,
	children,
	...headerProps
}: ComponentProps<typeof ScheduleFormHeader> & {
	visible: boolean;
	children: ReactNode;
}) => {
	const insets = useSafeAreaInsets();
	return (
		<Modal
			visible={visible}
			animationType="fade"
			onRequestClose={headerProps.onClose}
			transparent>
			<KeyboardAvoidingScreen
				keyboardVerticalOffset={0}
				style={{
					flex: 1,
					justifyContent: "center",
					paddingHorizontal: 20,
					paddingTop: insets.top + 16,
					paddingBottom: insets.bottom + 16,
				}}>
				<TouchableOpacity
					activeOpacity={1}
					onPress={headerProps.onClose}
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
						backgroundColor: "rgba(44, 42, 40, 0.42)",
					}}
				/>
				<TouchableOpacity
					activeOpacity={1}
					onPress={() => {}}
					style={{
						width: "100%",
						maxWidth: 640,
						alignSelf: "center",
						borderRadius: 12,
						backgroundColor: headerProps.colors.background,
						maxHeight: "100%",
						flexShrink: 1,
						overflow: "hidden",
					}}>
					<ScheduleFormHeader {...headerProps} />
					<ScrollView
						style={{flexGrow: 0, flexShrink: 1}}
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 20}}
						showsVerticalScrollIndicator>
						{children}
					</ScrollView>
				</TouchableOpacity>
			</KeyboardAvoidingScreen>
		</Modal>
	);
};

export const ScheduleFieldSeparator = ({colors}: ColoredProps) => (
	<View
		style={{height: 1, backgroundColor: colors.themeGrey, marginVertical: 12}}
	/>
);

export const ScheduleDetailsFields = ({
	colors,
	title,
	location,
	titlePlaceholder,
	onTitleChange,
	onLocationChange,
}: ColoredProps & {
	title: string;
	location: string;
	titlePlaceholder: string;
	onTitleChange: (value: string) => void;
	onLocationChange: (value: string) => void;
}) => (
	<RoundedView
		style={{
			marginTop: 8,
			paddingHorizontal: 18,
			paddingVertical: 20,
			backgroundColor: colors.card,
		}}>
		<TextInput
			style={{color: colors.formText, padding: 0, fontSize: 16}}
			placeholder={titlePlaceholder}
			placeholderTextColor={colors.formText}
			value={title}
			onChangeText={onTitleChange}
		/>
		<ScheduleFieldSeparator colors={colors} />
		<TextInput
			style={{color: colors.formText, padding: 0, fontSize: 16}}
			placeholder={getStr("location")}
			placeholderTextColor={colors.formText}
			value={location}
			onChangeText={onLocationChange}
		/>
	</RoundedView>
);

export const ScheduleTimeFields = ({
	colors,
	customDateTime,
	onModeChange,
	children,
}: ColoredProps & {
	customDateTime: boolean;
	onModeChange: (custom: boolean) => void;
	children: ReactNode;
}) => (
	<RoundedView
		style={{
			marginTop: 20,
			paddingHorizontal: 18,
			paddingVertical: 20,
			backgroundColor: colors.card,
		}}>
		<View
			style={{
				flexDirection: "row",
				marginBottom: 12,
				alignSelf: "center",
				backgroundColor: colors.unselectedTab,
				borderRadius: 999,
				padding: 2,
			}}>
			{[false, true].map((custom) => (
				<TouchableOpacity
					key={String(custom)}
					onPress={() => onModeChange(custom)}
					style={{
						paddingVertical: 6,
						paddingHorizontal: 12,
						borderRadius: 16,
						backgroundColor:
							customDateTime === custom ? colors.selectedTab : "transparent",
					}}>
					<Text
						style={{
							fontSize: 14,
							color:
								customDateTime === custom
									? colors.selectedTabText
									: colors.unselectedTabText,
						}}>
						{getStr(
							custom ? "scheduleAddModeDateTime" : "scheduleAddModeWeekPeriod",
						)}
					</Text>
				</TouchableOpacity>
			))}
		</View>
		{children}
	</RoundedView>
);
