import {useState} from "react";
import {helper} from "../../redux/store";
import {Text, View, useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {NetworkRetry} from "../../components/easySnackbars";
import {getStr} from "../../utils/i18n";
import {GestureHandlerRootView, RefreshControl, ScrollView} from "react-native-gesture-handler";
import {RoundedView} from "../../components/views";
import { UseregAuthError } from "@thu-info/lib/src/utils/error";
import { RootNav } from "../../components/Root";
import { Balance } from "@thu-info/lib/dist/models/network/balance";
import { AccountInfo } from "@thu-info/lib/dist/models/network/account";

export const NetworkDetailScreen = ({navigation}: {navigation: RootNav}) => {
	const [balance, setBalance] = useState<Balance>();
	const [accountInfo, setAccountInfo] = useState<AccountInfo>();

	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		(async () => {
			await helper
				.getNetworkBalance()
				.then((b) => setBalance(b));
			await helper
				.getNetworkAccountInfo()
				.then((a) => setAccountInfo(a));
		})().catch((e) => {
			if (e instanceof UseregAuthError) {
				navigation.navigate("NetworkLogin");
			} else {
				NetworkRetry(e);
			}
		}).then(() => setRefreshing(false));
	};

	interface RowProps {
		left: string;
		right: string;
	}

	const Row = ({left, right}: RowProps) => (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "space-between",
				margin: 8,
				marginLeft: 48,
				marginRight: 48,
			}}>
			<Text style={{
				color: colors.fontB2,
				fontSize: 18,
			}}>{left}</Text>
			<Text style={{
				color: colors.text,
				fontSize: 18,
				fontWeight: "bold",
			}}>{right}</Text>
		</View>
	);

	return (
		<GestureHandlerRootView>
		<ScrollView
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
					progressBackgroundColor={colors.contentBackground}
				/>
			}>
			<RoundedView style={{margin: 24}}>
				<Row left={getStr("networkUsername")} right={accountInfo?.username ?? ""}/>
				<Row left={getStr("networkRealName")} right={accountInfo?.realName ?? ""}/>
				<Row left={getStr("networkContactEmail")} right={accountInfo?.contactEmail ?? ""}/>
				<Row left={getStr("networkAccountStatus")} right={accountInfo?.status ?? ""}/>
				<Row left={getStr("networkUserGroup")} right={accountInfo?.userGroup ?? ""}/>
				<Row left={getStr("networkProductName")} right={balance?.productName ?? ""}/>
				<Row left={getStr("networkRemainder")} right={`${balance?.accountBalance ?? "0.00"}`}/>
				<Row left={getStr("networkSettlementDate")} right={balance?.settlementDate ?? ""}/>
				<Row left={getStr("networkUsedBytes")} right={balance?.usedBytes ?? ""}/>
				<Row left={getStr("networkUsedTime")} right={balance?.usedSeconds ?? ""}/>
				<Row left={getStr("networkAllowedDevices")} right={accountInfo?.allowedDevices.toString() ?? ""}/>
			</RoundedView>
		</ScrollView>
		</GestureHandlerRootView>
	);
};
