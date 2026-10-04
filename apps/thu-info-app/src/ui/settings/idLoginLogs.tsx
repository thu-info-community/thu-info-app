import {useCallback, useEffect, useRef, useState} from "react";
import {FlatList, Text, useColorScheme} from "react-native";
import {useSelector} from "react-redux";
import type {IdLoginLog} from "@thu-info/lib/src/models/id/account";
import type {RootNav} from "../../components/Root";
import {
	IdField,
	IdFieldRow,
	IdLoadError,
	IdLoading,
	IdSection,
} from "../../components/settings/idViews";
import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import themes from "../../assets/themes/themes";
import {helper, State} from "../../redux/store";
import {getStr} from "../../utils/i18n";

const LoginLogs = () => {
	const {colors} = themes(useColorScheme());
	const [items, setItems] = useState<IdLoginLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(true);
	const [error, setError] = useState(false);
	const generation = useRef(0);
	const page = useRef(0);
	const count = useRef(0);
	const hasMore = useRef(true);
	const inFlight = useRef(false);
	const failed = useRef(false);

	const load = useCallback(async (reset: boolean) => {
		if (!reset && (inFlight.current || !hasMore.current)) return;
		const request = ++generation.current;
		if (reset) {
			page.current = 0;
			count.current = 0;
			hasMore.current = true;
			setItems([]);
		}
		const requestedPage = page.current + 1;
		inFlight.current = true;
		failed.current = false;
		setLoading(true);
		setRefreshing(reset);
		setError(false);
		try {
			const result = await helper.getIdLoginLogs(requestedPage);
			if (generation.current !== request) return;
			page.current = requestedPage;
			count.current += result.items.length;
			hasMore.current = result.items.length > 0 && count.current < result.total;
			setItems((previous) =>
				reset ? result.items : previous.concat(result.items),
			);
		} catch {
			if (generation.current === request) {
				failed.current = true;
				setError(true);
			}
		} finally {
			if (generation.current === request) {
				inFlight.current = false;
				setLoading(false);
				setRefreshing(false);
			}
		}
	}, []);

	useEffect(() => {
		const requests = generation;
		load(true);
		return () => {
			++requests.current;
		};
	}, [load]);

	const retry = () => load(page.current === 0);
	return (
		<FlatList
			testID="idLoginLogsList"
			data={items}
			contentContainerStyle={{
				padding: 16,
				width: "100%",
				maxWidth: 640,
				alignSelf: "center",
				flexGrow: 1,
			}}
			keyExtractor={(_item, index) => String(index)}
			refreshControl={
				<ThemedRefreshControl
					refreshing={refreshing}
					onRefresh={() => load(true)}
				/>
			}
			renderItem={({item}) => (
				<IdSection>
					<IdFieldRow columnWeights={[2, 2, 1]}>
						<IdField label={getStr("idLoginTime")} value={item.loginTime} />
						<IdField label={getStr("idLoginIp")} value={item.ipAddress} />
						<IdField
							label={getStr("idSingleSignOn")}
							value={getStr(item.isSingleSignOn ? "yes" : "no")}
						/>
					</IdFieldRow>
					<IdField
						value={
							item.appName
								? item.targetAppName
									? getStr("idLoginViaSso")
											.replace("{0}", item.targetAppName)
											.replace("{1}", item.appName)
									: getStr("idLoginAppOnly").replace("{0}", item.appName)
								: "—"
						}
					/>
				</IdSection>
			)}
			ListEmptyComponent={
				loading ? (
					<IdLoading />
				) : error ? (
					<IdLoadError onRetry={retry} />
				) : (
					<Text
						style={{color: colors.fontB2, textAlign: "center", padding: 16}}>
						{getStr("idNoLoginLogs")}
					</Text>
				)
			}
			ListFooterComponent={
				items.length > 0 ? (
					loading ? (
						<IdLoading />
					) : error ? (
						<IdLoadError onRetry={retry} />
					) : undefined
				) : undefined
			}
			onEndReachedThreshold={0.4}
			onEndReached={() => {
				if (page.current > 0 && !failed.current) load(false);
			}}
		/>
	);
};

export const IdLoginLogsScreen = ({navigation}: {navigation: RootNav}) => {
	const userId = useSelector((state: State) => state.auth.userId);
	return userId ? (
		<LoginLogs key={userId} />
	) : (
		<IdLoadError
			message={getStr("idLoginRequired")}
			retryLabel={getStr("login")}
			onRetry={() => navigation.navigate("Login")}
		/>
	);
};
