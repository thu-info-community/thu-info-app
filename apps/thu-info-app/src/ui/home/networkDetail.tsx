import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import {useEffect, useState} from "react";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {getStr} from "../../utils/i18n";
import {
	GestureHandlerRootView,
	ScrollView,
} from "react-native-gesture-handler";
import {useIsFocused} from "@react-navigation/native";
import {SectionCard} from "../../components/subpage/containers";
import {DetailRow} from "../../components/subpage/rows";
import {RootNav} from "../../components/Root";
import {Balance} from "@thu-info/lib/src/models/network/balance";
import {AccountInfo} from "@thu-info/lib/src/models/network/account";

export const NetworkDetailScreen = ({navigation}: {navigation: RootNav}) => {
	const [balance, setBalance] = useState<Balance>();
	const [accountInfo, setAccountInfo] = useState<AccountInfo>();

	const [refreshing, setRefreshing] = useState(false);
	const isFocused = useIsFocused();

	const refresh = () => {
		if (!isFocused) {
			return;
		}
		setRefreshing(true);
		(async () => {
			// Sequential on purpose: on a cold usereg session both calls would fail
			// their login probe and roam into usereg concurrently, and two parallel
			// SSO entries can invalidate each other. The first call establishes the
			// session for the second.
			const b = await helper.getNetworkBalance();
			const a = await helper.getNetworkAccountInfo();
			setBalance(b);
			setAccountInfo(a);
		})()
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, [isFocused, navigation]);

	interface RowProps {
		left: string;
		right: string;
	}

	const Row = ({left, right}: RowProps) => (
		<DetailRow label={left} value={right} />
	);

	return (
		<GestureHandlerRootView>
			<ScrollView
				refreshControl={
					<ThemedRefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
					/>
				}>
				<SectionCard>
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
				</SectionCard>
			</ScrollView>
		</GestureHandlerRootView>
	);
};
