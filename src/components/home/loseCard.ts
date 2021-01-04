import {Alert} from "react-native";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";

export const performLoseCard = () => {
	Alert.alert(
		getStr("confirmLoseCard"),
		getStr("loseCardCannotBeUndone"),
		[
			{
				text: getStr("cancel"),
				style: "cancel",
			},
			{
				text: getStr("confirm"),
				onPress: () => {
					helper
						.loseCard()
						.then((value) => {
							// Why setTimeOut? https://github.com/cooperka/react-native-snackbar/issues/28
							setTimeout(() => {
								if (value === 2) {
									Snackbar.show({
										text: "挂失成功！",
										duration: Snackbar.LENGTH_SHORT,
									});
								} else {
									const valueToText = new Map<number, string>([
										[4, "您的卡片已经处于挂失状态，请不要重复挂失！"],
										[5, "卡片状态无效，无法挂失！"],
										[-1, "挂失处理失败，没有此卡信息，请联系卡务中心！"],
										[-2, "挂失处理失败，此卡有效期错误，请联系卡务中心！"],
										[
											-100,
											"挂失处理失败，学校服务器数据库错误，请联系卡务中心！",
										],
										[
											7,
											"挂失处理失败，学校服务器挂失服务异常，请联系卡务中心！",
										],
									]);
									Snackbar.show({
										text:
											valueToText.get(value) ??
											`挂失处理失败，未知错误[错误代码：${value}]，请联系卡务中心！`,
										duration: Snackbar.LENGTH_INDEFINITE,
										action: {text: getStr("ok")},
									});
								}
							}, 100);
						})
						.catch(() =>
							setTimeout(() => {
								Snackbar.show({
									text: getStr("networkRetry"),
									duration: Snackbar.LENGTH_SHORT,
								});
							}, 100),
						);
				},
			},
		],
		{cancelable: true},
	);
};
