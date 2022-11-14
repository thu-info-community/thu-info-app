import {KeyboardAvoidingView, Platform} from "react-native";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {WebView} from "react-native-webview";
import VersionNumber from "react-native-version-number";
import {getModel} from "react-native-device-info";

export const FeishuFeedbackScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{flex: 1}}>
			<WebView
				forceDarkOn={themeName === "dark"}
				style={{
					backgroundColor: colors.themeBackground,
					color: colors.text,
				}}
				setSupportMultipleWindows={false}
				source={{
					uri: "https://thu-info.feishu.cn/share/base/form/shrcnf5hn4C4Dy91Gkhl0t9gouc",
				}}
				injectedJavaScript={`
function inject_autoFill() {
    e = document.querySelector("#field-item-fldWP4XSFc div[contenteditable=true]");
    if (e === null) return false;
    e.focus();
    document.execCommand("insertText", false, "${VersionNumber.appVersion}");
    e.contentEditable = false;

    e = document.querySelector("#field-item-fldKYBkoZ4 div[contenteditable=true]");
    if (e === null) return false;
    e.focus();
    document.execCommand("insertText", false, "${Platform.OS}");
    e.contentEditable = false;

    e = document.querySelector("#field-item-fldUfa9jMZ div[contenteditable=true]");
    if (e === null) return false;
    e.focus();
    document.execCommand("insertText", false, \`${getModel()}\`);
    e.contentEditable = false;

    return true;
}

function inject_retry() {
    if (!inject_autoFill()) {
        setTimeout(inject_retry, 100);
    }
}

localStorage.clear();
inject_retry();
true;
			`}
			/>
		</KeyboardAvoidingView>
	);
};
