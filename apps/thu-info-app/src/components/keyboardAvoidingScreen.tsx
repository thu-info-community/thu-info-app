import {useContext} from "react";
import {HeaderHeightContext} from "@react-navigation/elements";
import {KeyboardAvoidingView, Platform, View, ViewProps} from "react-native";

type Props = ViewProps & {keyboardVerticalOffset?: number};

// Keep absolute-positioned children inside the area left above the keyboard.
// The PIN unlock screen can also render outside a navigation container.
export const KeyboardAvoidingScreen = ({
	children,
	style,
	keyboardVerticalOffset,
	...props
}: Props) => {
	const headerHeight = useContext(HeaderHeightContext) ?? 0;
	return (
		<KeyboardAvoidingView
			style={{flex: 1}}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={keyboardVerticalOffset ?? headerHeight}>
			<View {...props} style={[{flex: 1}, style]}>
				{children}
			</View>
		</KeyboardAvoidingView>
	);
};
