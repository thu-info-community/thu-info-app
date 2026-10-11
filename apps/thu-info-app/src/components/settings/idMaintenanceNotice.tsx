import {
	Text,
	TouchableOpacityProps,
	useColorScheme,
	useWindowDimensions,
	View,
} from "react-native";
import {BottomPopupTriggerView} from "../views";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {scaledLineHeight} from "../../utils/scaledText";

export const IdMaintenanceNotice = ({
	forgotPassword = false,
	...props
}: TouchableOpacityProps & {forgotPassword?: boolean}) => {
	const {colors} = themes(useColorScheme());
	const {fontScale} = useWindowDimensions();
	return (
		<BottomPopupTriggerView
			{...props}
			accessibilityRole="button"
			popupTitle={getStr(
				forgotPassword ? "forgotPassword" : "idMaintenanceTitle",
			)}
			popupContent={
				<View style={{paddingHorizontal: 20}}>
					<Text
						selectable
						style={{
							color: colors.text,
							fontSize: 17,
							lineHeight: scaledLineHeight(26, fontScale),
						}}>
						{getStr(
							forgotPassword
								? "idForgotPasswordMessage"
								: "idMaintenanceMessage",
						)}
					</Text>
				</View>
			}
			popupCanFulfill
			popupCancelable
			popupOnFulfilled={() => {}}
			popupOnCancelled={() => {}}
		/>
	);
};
