import {useCallback, useEffect, useRef, useState} from "react";
import {ScrollView, Text, useColorScheme, View} from "react-native";
import {useSelector} from "react-redux";
import dayjs from "dayjs";
import type {
	IdAccountInfo,
	IdAuthDevice,
} from "@thu-info/lib/src/models/id/account";
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

const PersonalInfo = () => {
	const {colors} = themes(useColorScheme());
	const [account, setAccount] = useState<IdAccountInfo>();
	const [devices, setDevices] = useState<IdAuthDevice[]>();
	const [loading, setLoading] = useState(true);
	const [deviceLoading, setDeviceLoading] = useState(false);
	const [accountError, setAccountError] = useState(false);
	const [deviceError, setDeviceError] = useState(false);
	const generation = useRef(0);
	const deviceRequest = useRef(0);

	const loadDevices = useCallback(async (parent: number) => {
		const request = ++deviceRequest.current;
		setDeviceLoading(true);
		setDeviceError(false);
		const current = () =>
			generation.current === parent && deviceRequest.current === request;
		try {
			const result = await helper.getIdAuthDevices();
			if (current()) setDevices(result);
		} catch {
			if (current()) setDeviceError(true);
		} finally {
			if (current()) setDeviceLoading(false);
		}
	}, []);

	const refresh = useCallback(async () => {
		const request = ++generation.current;
		++deviceRequest.current;
		setAccount(undefined);
		setDevices(undefined);
		setLoading(true);
		setDeviceLoading(false);
		setAccountError(false);
		setDeviceError(false);
		try {
			const result = await helper.getIdAccountInfo();
			if (generation.current !== request) return;
			setAccount(result);
			await loadDevices(request);
		} catch {
			if (generation.current === request) setAccountError(true);
		} finally {
			if (generation.current === request) setLoading(false);
		}
	}, [loadDevices]);

	useEffect(() => {
		const requests = generation;
		const deviceRequests = deviceRequest;
		refresh();
		return () => {
			++requests.current;
			++deviceRequests.current;
		};
	}, [refresh]);

	const changedAt = account?.lastPasswordChangedAt;
	const changedDate = changedAt == null ? null : dayjs(changedAt);
	return (
		<ScrollView
			testID="idPersonalInfoScroll"
			contentContainerStyle={{
				padding: 16,
				width: "100%",
				maxWidth: 640,
				alignSelf: "center",
			}}
			refreshControl={
				<ThemedRefreshControl
					refreshing={loading || deviceLoading}
					onRefresh={refresh}
				/>
			}>
			{loading && !account && <IdLoading />}
			{accountError && <IdLoadError onRetry={refresh} />}
			{account && (
				<>
					<IdSection title={getStr("idBasicInfo")}>
						<IdFieldRow>
							<IdField label={getStr("idSchoolId")} value={account.userId} />
							<IdField label={getStr("idRealName")} value={account.fullName} />
						</IdFieldRow>
						<IdFieldRow>
							<IdField label={getStr("idUsername")} value={account.username} />
							<IdField
								label={getStr("idDepartment")}
								value={account.deptString}
							/>
						</IdFieldRow>
					</IdSection>
					<IdSection title={getStr("idAccountSecurity")}>
						<IdFieldRow>
							<IdField
								label={getStr("idLastPasswordChanged")}
								value={
									changedDate?.isValid()
										? changedDate.format("YYYY-MM-DD HH:mm:ss")
										: getStr("idUnknown")
								}
							/>
							<IdField
								label={getStr("phoneNumber")}
								value={account.phone || getStr("idNotBound")}
							/>
						</IdFieldRow>
					</IdSection>
					<IdSection title={getStr("idAuthDevices")}>
						{deviceLoading && <IdLoading />}
						{deviceError && (
							<IdLoadError onRetry={() => loadDevices(generation.current)} />
						)}
						{devices?.length === 0 && (
							<Text style={{color: colors.fontB2}}>
								{getStr("idNoAuthDevices")}
							</Text>
						)}
						{devices?.map((device, index) => (
							<View
								key={device.id}
								style={{
									paddingVertical: 8,
									borderTopWidth: index === 0 ? 0 : 1,
									borderTopColor: colors.themeTransparentGrey,
								}}>
								<IdField label={getStr("idDeviceName")} value={device.name} />
								<IdFieldRow>
									<IdField
										label={getStr("idDeviceCreatedAt")}
										value={device.createdAt || getStr("idUnknown")}
									/>
									<IdField
										label={getStr("idDeviceUpdatedAt")}
										value={device.updatedAt || getStr("idUnknown")}
									/>
								</IdFieldRow>
							</View>
						))}
					</IdSection>
				</>
			)}
		</ScrollView>
	);
};

export const IdPersonalInfoScreen = ({navigation}: {navigation: RootNav}) => {
	const userId = useSelector((state: State) => state.auth.userId);
	return userId ? (
		<PersonalInfo key={userId} />
	) : (
		<IdLoadError
			message={getStr("idLoginRequired")}
			retryLabel={getStr("login")}
			onRetry={() => navigation.navigate("Login")}
		/>
	);
};
