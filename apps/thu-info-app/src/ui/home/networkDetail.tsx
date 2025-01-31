import {useEffect, useState} from "react";
import {helper} from "../../redux/store";
import {Text, View, useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {NetworkRetry} from "../../components/easySnackbars";
import {getStr} from "../../utils/i18n";
import {
	GestureHandlerRootView,
	RefreshControl,
	ScrollView,
} from "react-native-gesture-handler";
import {useIsFocused} from "@react-navigation/native";
import {RoundedView} from "../../components/views";
import {UseregAuthError} from "@thu-info/lib/src/utils/error";
import {RootNav} from "../../components/Root";
import {Balance} from "@thu-info/lib/src/models/network/balance";
import {AccountInfo} from "@thu-info/lib/src/models/network/account";

export const NetworkDetailScreen = ({navigation}: {navigation: RootNav}) => {
	const [balance, setBalance] = useState<Balance>();
	const [accountInfo, setAccountInfo] = useState<AccountInfo>();

	const [refreshing, setRefreshing] = useState(false);
	const isFocused = useIsFocused();

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = () => {
		if (!isFocused) {
			return;
		}
		setRefreshing(true);
		(async () => {
			const [b, a] = await Promise.all([
				helper.getNetworkBalance(),
				helper.getNetworkAccountInfo(),
			]);
			setBalance(b);
			setAccountInfo(a);
		})()
			.catch((e) => {
				if (e instanceof UseregAuthError) {
					navigation.navigate("NetworkLogin");
				} else {
					NetworkRetry(e);
				}
			})
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, [isFocused, navigation]);

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
				marginHorizontal: 16,
			}}>
			<Text
				style={{
					color: colors.fontB3,
					fontSize: 16,
				}}>
				{left}
			</Text>
			<Text
				style={{
					color: colors.text,
					fontSize: 16,
				}}>
				{right}
			</Text>
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
				<RoundedView style={{margin: 24, paddingVertical: 8}}>
					<Row
						left={getStr("networkUsername")}
						right={accountInfo?.username ?? "-"}
					/>
					<Row
						left={getStr("networkRealName")}
						right={accountInfo?.realName ?? "-"}
					/>
					<Row
						left={getStr("networkContactEmail")}
						right={accountInfo?.contactEmail ?? "-"}
					/>
					<Row
						left={getStr("networkAccountStatus")}
						right={accountInfo?.status ?? "-"}
					/>
					<Row
						left={getStr("networkUserGroup")}
						right={accountInfo?.userGroup ?? "-"}
					/>
					<Row
						left={getStr("networkProductName")}
						right={balance?.productName ?? "-"}
					/>
					<Row
						left={getStr("networkRemainder")}
						right={balance?.accountBalance ?? "-"}
					/>
					<Row
						left={getStr("networkSettlementDate")}
						right={balance?.settlementDate ?? "-"}
					/>
					<Row
						left={getStr("networkUsedBytes")}
						right={
							(balance?.usedBytes ?? "-") +
							(!balance?.usedBytes || balance?.usedBytes?.includes("byte")
								? ""
								: "B")
						}
					/>
					<Row
						left={getStr("networkUsedTime")}
						right={balance?.usedSeconds ?? "-"}
					/>
					<Row
						left={getStr("networkAllowedDevices")}
						right={accountInfo?.allowedDevices.toString() ?? "-"}
					/>
				</RoundedView>
			</ScrollView>
		</GestureHandlerRootView>
	);
};
