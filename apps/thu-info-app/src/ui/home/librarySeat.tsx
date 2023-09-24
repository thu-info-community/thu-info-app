import {LibrarySeatRouteProp} from "../../components/Root";
import {Alert} from "react-native";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";
import {helper, store} from "../../redux/store";
import {Text, View} from "react-native";
import {setActiveLibBookRecord} from "../../redux/slices/reservation";

export const LibrarySeatScreen = libraryRefreshListScreen(
	({route}: {route: LibrarySeatRouteProp}, dateChoice) =>
		helper.getLibrarySeatList(route.params.section, dateChoice),
	(props, item, choice, refresh) => () => {
		if (!helper.mocked()) {
			Alert.alert(
				getStr("checkSeat"),
				item.zhNameTrace +
					"\n" +
					getStr(choice === 0 ? "todayBookHint" : "tomorrowBookHint"),
				[
					{text: getStr("cancel"), style: "cancel"},
					{
						text: getStr("confirm"),
						onPress: () => {
							Snackbar.show({
								text: getStr("processing"),
								duration: Snackbar.LENGTH_SHORT,
							});
							helper
								.bookLibrarySeat(item, props.route.params.section, choice)
								.then(({status, msg}) => {
									Snackbar.show({
										text:
											status === 1
												? getStr("bookSuccess")
												: getStr("bookFailureColon") + msg,
										duration: Snackbar.LENGTH_SHORT,
									});
									refresh();
									helper.getBookingRecords().then((r) => {
										store.dispatch(setActiveLibBookRecord(r));
									});
								})
								.catch(() =>
									Snackbar.show({
										text: getStr("networkRetry"),
										duration: Snackbar.LENGTH_SHORT,
									}),
								);
						},
					},
				],
				{cancelable: true},
			);
		}
	},
	(theme) => (
		<View style={{justifyContent: "center"}}>
			<Text
				style={{
					fontSize: 16,
					fontWeight: "bold",
					textAlign: "center",
					marginBottom: 15,
					color: theme.colors.text,
				}}>
				{getStr("bookTips")}
			</Text>
			<View style={{backgroundColor: "lightgray", height: 1}} />
		</View>
	),
);
