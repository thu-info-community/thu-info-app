import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {RoundedView} from "../../components/views";
import type {RootNav} from "../../components/Root";
import type {
	ThosService,
	ThosTask,
} from "@thu-info/lib/src/models/home/thos-services";
import {
	getThosPhaseStateLabel,
	getThosTaskStatusLabel,
	useThosBrowserHeader,
} from "./thos";

export type ThosTaskDetailParams = {task: ThosTask; accountId: string};
export type ThosServiceDetailParams = {service: ThosService; accountId: string};

function useDetail<T>(initial: T, accountId: string, read: () => Promise<T>) {
	const userId = useSelector((s: State) => s.auth.userId);
	const allowed = !!userId && userId === accountId;
	const [data, setData] = useState(initial);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const requests = useRef(0);
	useEffect(() => {
		const generation = requests;
		setData(initial);
		setError(undefined);
		setBusy(false);
		return () => {
			generation.current++;
		};
	}, [initial, userId, accountId]);
	const refresh = async () => {
		if (!allowed || busy) return;
		const token = ++requests.current;
		setBusy(true);
		setError(undefined);
		try {
			const result = await read();
			if (token === requests.current) setData(result);
		} catch {
			if (token === requests.current)
				setError(getStr("thosDetailUpdateFailed"));
		} finally {
			if (token === requests.current) setBusy(false);
		}
	};
	return {data, allowed, busy, error, refresh};
}

const Fact = ({label, value}: {label: string; value?: string}) => {
	const {colors} = themes(useColorScheme());
	if (!value) return null;
	return (
		<View style={{paddingVertical: 12, gap: 6}}>
			<Text style={{color: colors.fontB2, fontSize: 13}}>{label}</Text>
			<Text selectable style={{color: colors.text, fontSize: 16}}>
				{value}
			</Text>
		</View>
	);
};

const DetailPage = ({
	title,
	allowed,
	busy,
	refresh,
	error,
	children,
}: React.PropsWithChildren<{
	title: string;
	allowed: boolean;
	busy: boolean;
	refresh: () => Promise<void>;
	error?: string;
}>) => {
	const {colors} = themes(useColorScheme());
	if (!allowed)
		return (
			<View style={{padding: 24}} testID="thos-account-changed">
				<Text style={{color: colors.text}}>{getStr("thosAccountChanged")}</Text>
			</View>
		);
	return (
		<ScrollView
			testID="thos-native-detail"
			style={{flex: 1, backgroundColor: colors.themeBackground}}
			refreshControl={
				<ThemedRefreshControl
					refreshing={busy}
					onRefresh={refresh}
				/>
			}
			contentContainerStyle={{
				padding: 16,
				paddingBottom: 48,
				width: "100%",
				maxWidth: 1000,
				alignSelf: "center",
				gap: 16,
			}}>
			<Text style={{fontSize: 25, fontWeight: "700", color: colors.text}}>
				{title}
			</Text>
			{error && (
				<Text testID="thos-detail-error" style={{color: colors.statusError}}>
					{error}
				</Text>
			)}
			{children}
		</ScrollView>
	);
};

export const ThosTaskDetailScreen = ({
	route,
	navigation,
}: {
	route: {params: ThosTaskDetailParams};
	navigation: RootNav;
}) => {
	const {colors} = themes(useColorScheme());
	const {task: initial, accountId} = route.params;
	const detail = useDetail(initial, accountId, async () => {
		const page = await helper.getThosTasks(initial.kind);
		const task = page.items.find((item) => item.key === initial.key);
		if (!task) throw new Error("not in original list");
		return task;
	});
	const task = detail.data;
	const openWebsite = useCallback(() => {
		if (task.url) navigation.navigate("ThosPortal", {url: task.url});
	}, [navigation, task.url]);
	useThosBrowserHeader(
		navigation,
		openWebsite,
		helper.mocked() || !task.url,
		detail.allowed,
	);
	return (
		<DetailPage
			title={detail.allowed ? task.title : getStr("thosTaskDetail")}
			{...detail}>
			<RoundedView style={{paddingHorizontal: 20}}>
				<Text
					style={{color: colors.mainTheme, fontSize: 22, fontWeight: "700"}}>
					{getThosTaskStatusLabel(task.status)}
				</Text>
				<Fact label={getStr("thosCurrentNode")} value={task.node} />
				{task.progress !== undefined && (
					<View style={{gap: 10}}>
						<Text style={{color: colors.fontB2}}>
							{getStr("thosFlowProgress").replace("{0}", String(task.progress))}
						</Text>
						<View
							accessibilityLabel={getStr("thosAccessibilityProgress").replace(
								"{0}",
								String(task.progress),
							)}
							style={{
								height: 8,
								borderRadius: 4,
								backgroundColor: colors.themeGrey,
							}}>
							<View
								style={{
									height: 8,
									borderRadius: 4,
									width: `${task.progress}%`,
									backgroundColor: colors.mainTheme,
								}}
							/>
						</View>
					</View>
				)}
				<Fact
					label={getStr("thosWorkflowStatus")}
					value={
						task.workflowStatus
							? getThosTaskStatusLabel(task.workflowStatus)
							: undefined
					}
				/>
				<Fact label={getStr("thosSummary")} value={task.summary} />
			</RoundedView>
			{task.phaseSteps && task.phaseSteps.length > 0 && (
				<RoundedView style={{paddingHorizontal: 20}}>
					<Text style={{color: colors.text, fontSize: 18, fontWeight: "600"}}>
						{getStr("thosPhaseDetails")}
					</Text>
					{task.phaseSteps.map((step) => (
						<View key={`${step.order}:${step.name}`} style={{paddingTop: 16}}>
							<Text style={{color: colors.text, fontWeight: "600"}}>
								{step.order}. {step.name} · {getThosPhaseStateLabel(step.state)}
							</Text>
							{step.items.map((item) => (
								<TouchableOpacity
									key={item.id}
									disabled={!item.url}
									onPress={() => {
										if (item.url)
											navigation.navigate("ThosPortal", {url: item.url});
									}}
									accessibilityRole="button"
									style={{paddingVertical: 10}}>
									<Text
										style={{
											color: item.url ? colors.mainTheme : colors.fontB2,
										}}>
										{item.name} · {getThosPhaseStateLabel(item.state)}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					))}
					{task.relatedServices && task.relatedServices.length > 0 && (
						<View style={{paddingTop: 20}}>
							<Text style={{color: colors.text, fontWeight: "600"}}>
								{getStr("thosRelatedServices")}
							</Text>
							{task.relatedServices.map((service) => (
								<TouchableOpacity
									key={service.id}
									onPress={() =>
										navigation.navigate("ThosPortal", {url: service.url})
									}
									accessibilityRole="button"
									style={{paddingVertical: 10}}>
									<Text style={{color: colors.mainTheme}}>{service.name}</Text>
								</TouchableOpacity>
							))}
						</View>
					)}
				</RoundedView>
			)}
			<RoundedView style={{paddingHorizontal: 20}}>
				<Fact label={getStr("thosTaskNumber")} value={task.id} />
				{task.kind !== "phases" && (
					<Fact
						label={
							task.kind === "completed"
								? getStr("thosCompletionTime")
								: task.kind === "drafts"
									? getStr("thosLastModifiedTime")
									: getStr("thosApplicationTime")
						}
						value={task.date}
					/>
				)}
			</RoundedView>
		</DetailPage>
	);
};

const getServiceKindLabel = (kind: NonNullable<ThosService["kind"]>) => {
	switch (kind) {
		case "form":
			return getStr("thosFormService");
		case "guide":
			return getStr("thosGuideService");
		case "integration":
			return getStr("thosIntegrationService");
		case "group":
			return getStr("thosServiceGroup");
	}
};

export const ThosServiceDetailScreen = ({
	route,
	navigation,
}: {
	route: {params: ThosServiceDetailParams};
	navigation: RootNav;
}) => {
	const {colors} = themes(useColorScheme());
	const {service: initial, accountId} = route.params;
	const detail = useDetail(initial, accountId, async () => {
		const page = await helper.getThosServices();
		const service = page.items.find((item) => item.id === initial.id);
		if (!service) throw new Error("not in current directory");
		return service;
	});
	const service = detail.data;
	const openWebsite = useCallback(() => {
		if (service.url) navigation.navigate("ThosPortal", {url: service.url});
	}, [navigation, service.url]);
	useThosBrowserHeader(
		navigation,
		openWebsite,
		helper.mocked() || !service.url,
		detail.allowed,
	);
	return (
		<DetailPage
			title={detail.allowed ? service.name : getStr("thosServiceInfo")}
			{...detail}>
			<RoundedView style={{paddingHorizontal: 20}}>
				<Fact label={getStr("thosDepartment")} value={service.department} />
				<Fact
					label={getStr("thosServiceType")}
					value={service.kind ? getServiceKindLabel(service.kind) : undefined}
				/>
				<Fact
					label={getStr("thosOpenStatus")}
					value={
						service.inOpenPeriod === undefined
							? undefined
							: service.inOpenPeriod
								? getStr("thosInOpenPeriod")
								: getStr("thosOutOfOpenPeriod")
					}
				/>
			</RoundedView>
			<RoundedView style={{paddingHorizontal: 20}}>
				<Text style={{color: colors.text, fontSize: 18, fontWeight: "600"}}>
					{getStr("thosHowToHandle")}
				</Text>
				<Text style={{color: colors.fontB1, marginTop: 12, lineHeight: 24}}>
					{service.kind === "group"
						? getStr("thosServiceGroupDescription")
						: getStr("thosServiceDescription")}
				</Text>
			</RoundedView>
			<Text style={{color: colors.fontB2}}>{getStr("thosFavoriteHint")}</Text>
		</DetailPage>
	);
};
