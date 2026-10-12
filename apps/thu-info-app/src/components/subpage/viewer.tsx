import {ReactNode} from "react";
import {Text, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {ErrorState, LoadingState} from "./rows";

/**
 * Chrome for full-bleed viewers (WebView/PDF). Provides the themed background
 * and the loading/error states; callers keep ownership of the viewer itself
 * (WebView/Pdf source, dark-mode injection, etc.).
 */
export const ViewerContainer = ({
	loading,
	error,
	onRetry,
	children,
}: {
	loading?: boolean;
	error?: string;
	onRetry?: () => void;
	children: ReactNode;
}) => {
	const {colors} = themes(useColorScheme());
	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.themeBackground,
					justifyContent: "center",
				}}>
				<LoadingState label={getStr("loading")} />
			</View>
		);
	}
	if (error) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.themeBackground,
					justifyContent: "center",
				}}>
				{onRetry ? (
					<ErrorState onRetry={onRetry} message={error} />
				) : (
					<Text style={{color: colors.text, textAlign: "center"}}>{error}</Text>
				)}
			</View>
		);
	}
	return (
		<View style={{flex: 1, backgroundColor: colors.themeBackground}}>
			{children}
		</View>
	);
};
