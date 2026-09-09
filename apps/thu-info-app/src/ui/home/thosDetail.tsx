import React, {useCallback, useEffect, useRef, useState} from "react";
import {
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import type {RootNav} from "../../components/Root";
import type {
	ThosService,
	ThosTask,
} from "@thu-info/lib/src/models/home/thos-services";
import {useThosBrowserHeader} from "./thos";

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
				setError(
					"未能更新详情。当前显示上次读取的信息；事项状态可能已变化，请返回列表刷新核对。",
				);
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
				<Text style={{color: colors.text}}>
					登录账号已变化，请返回在线服务重新读取。
				</Text>
			</View>
		);
	return (
		<ScrollView
			testID="thos-native-detail"
			style={{flex: 1, backgroundColor: colors.themeBackground}}
			refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} />}
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
		<DetailPage title={detail.allowed ? task.title : "事务详情"} {...detail}>
			<RoundedView style={{paddingHorizontal: 20}}>
				<Text
					style={{color: colors.mainTheme, fontSize: 22, fontWeight: "700"}}>
					{task.status}
				</Text>
				<Fact label="当前办理节点" value={task.node} />
				{task.progress !== undefined && (
					<View style={{gap: 10}}>
						<Text style={{color: colors.fontB2}}>
							系统流程进度 {task.progress}%
						</Text>
						<View
							accessibilityLabel={`流程进度 ${task.progress}%`}
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
				<Fact label="办理状态" value={task.workflowStatus} />
				<Fact label="事项摘要" value={task.summary} />
			</RoundedView>
			{task.phaseSteps && task.phaseSteps.length > 0 && (
				<RoundedView style={{paddingHorizontal: 20}}>
					<Text style={{color: colors.text, fontSize: 18, fontWeight: "600"}}>
						阶段明细
					</Text>
					{task.phaseSteps.map((step) => (
						<View key={`${step.order}:${step.name}`} style={{paddingTop: 16}}>
							<Text style={{color: colors.text, fontWeight: "600"}}>
								{step.order}. {step.name} · {phaseStateLabels[step.state] ?? "状态未知"}
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
										{item.name} · {phaseStateLabels[item.state] ?? "状态未知"}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					))}
					{task.relatedServices && task.relatedServices.length > 0 && (
						<View style={{paddingTop: 20}}>
							<Text style={{color: colors.text, fontWeight: "600"}}>
								其他相关服务
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
				<Fact label="事务编号" value={task.id} />
				{task.kind !== "phases" && (
					<Fact
						label={
							task.kind === "completed"
								? "办结时间"
								: task.kind === "drafts"
									? "最后修改时间"
									: "申请时间"
						}
						value={task.date}
					/>
				)}
			</RoundedView>
		</DetailPage>
	);
};

const kindLabels = {
	form: "填报服务",
	guide: "引导服务",
	integration: "集成服务",
	group: "服务集合",
};
const phaseStateLabels: Record<string, string> = {
	"0": "待办理",
	"1": "正在办理",
	"4": "办理成功",
	"5": "办理失败",
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
		<DetailPage title={detail.allowed ? service.name : "服务信息"} {...detail}>
			<RoundedView style={{paddingHorizontal: 20}}>
				<Fact label="提供部门" value={service.department} />
				<Fact
					label="服务类型"
					value={service.kind ? kindLabels[service.kind] : undefined}
				/>
				<Fact
					label="开放时间状态"
					value={
						service.inOpenPeriod === undefined
							? undefined
							: service.inOpenPeriod
								? "在开放时间内"
								: "不在开放时间内"
					}
				/>
			</RoundedView>
			<RoundedView style={{paddingHorizontal: 20}}>
				<Text style={{color: colors.text, fontSize: 18, fontWeight: "600"}}>
					办理方式
				</Text>
				<Text style={{color: colors.fontB1, marginTop: 12, lineHeight: 24}}>
					{service.kind === "group"
						? "这是服务集合，具体事项与办理条件以官方目录为准。"
						: "服务信息在 App 内查看。申请表单目前仍由官方页面提供，进入后请按学校说明办理。"}
				</Text>
			</RoundedView>
			<Text style={{color: colors.fontB2}}>
				收藏常用服务后，可从「收藏服务」直接找到。收藏在目录中管理，仅保存在本机。
			</Text>
		</DetailPage>
	);
};
