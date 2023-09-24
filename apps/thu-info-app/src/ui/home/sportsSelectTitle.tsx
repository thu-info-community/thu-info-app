import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import IconCheck from "../../assets/icons/IconCheck";
import {RootNav, SportsSelectTitleProp} from "../../components/Root";
import {styles} from "../settings/settings";
import {VALID_RECEIPT_TITLES} from "thu-info-lib/dist/lib/sports";
import {getStr} from "../../utils/i18n";
import {useDispatch, useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {configSet} from "../../redux/slices/config";
import {doAlipay} from "../../utils/alipay";
import Snackbar from "react-native-snackbar";
import {useState} from "react";

export const SportsSelectTitleScreen = ({
	route: {params},
	navigation,
}: {
	route: SportsSelectTitleProp;
	navigation: RootNav;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	const titleSelected = useSelector((s: State) => s.config.receiptTitle);
	const dispatch = useDispatch();

	const [disabled, setDisabled] = useState(false);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				{[...VALID_RECEIPT_TITLES, undefined].map((title, index) => (
					<View key={title ?? "DEFAULT"}>
						{index > 0 && <View style={style.separator} />}
						<TouchableOpacity
							style={style.touchable}
							disabled={disabled}
							onPress={() => {
								setDisabled(true);
								Snackbar.show({
									text: getStr("processing"),
									duration: Snackbar.LENGTH_SHORT,
								});
								dispatch(configSet({key: "receiptTitle", value: title}));
								helper
									.paySportsReservation(params.payId, title)
									.then(doAlipay)
									.then(() => {
										navigation.pop();
									})
									.catch((e) => {
										Snackbar.show({
											text:
												typeof e.message === "string"
													? e.message
													: getStr("networkRetry"),
											duration: Snackbar.LENGTH_LONG,
										});
										setDisabled(false);
									});
							}}>
							<Text style={style.text}>
								{title ?? getStr("noReceiptTitle")}
							</Text>
							{title === titleSelected && <IconCheck width={18} height={18} />}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</View>
	);
};
