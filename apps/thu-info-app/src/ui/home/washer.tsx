import { FlatList, ScrollView, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import themes from "../../assets/themes/themes";
import { useEffect, useState } from "react";
import { getStr } from "../../utils/i18n";
import type { RootNav } from "../../components/Root";
import { IconStarButton } from "../../components/news/IconStarButton";
import { useDispatch, useSelector } from "react-redux";
import { configSet } from "../../redux/slices/config";
import type { State } from "../../redux/store";
import { NetworkRetry } from "../../components/easySnackbars.ts";
import {
	fetchJieliBuildings,
	fetchJieliFloors,
	fetchHaileBuildings,
	fetchHaileFloors,
	fetchXiaolanBuildings,
	fetchXiaolanFloors,
	isWasherFavourite,
} from "../../utils/washer";
import type {WasherBuilding as building, WasherBuildingGroup, Washer, WasherFloor as Floor, WasherProvider} from "../../utils/washer";

interface buildingGroup extends WasherBuildingGroup {
	xiaolan?: boolean;
}

const WASHER_PROVIDERS = [
	{provider: "all", label: "all"},
	{provider: "jieli", label: "jieli"},
	{provider: "haile", label: "haiLeShengHuo"},
	{provider: "xiaolan", label: "xiaolanSmart"},
] as const;

const WASHER_STATUS_LABELS = {
	idle: "washerIdle",
	working: "washerWorking",
	error: "washerError",
	offline: "washerOffline",
	standby: "washerStandby",
	unknown: "washerUnknown",
} as const;

export const WasherScreen = ({ navigation }: { navigation: RootNav }) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const [selectedProvider, setSelectedProvider] = useState<WasherProvider | "all">("all");

	const currentFavourites = useSelector(
		(s: State) => s.config.washerFavourites ?? [],
	);

	const [fetchedBuildingGroups, setFetchedBuildingGroups] = useState<
		buildingGroup[]
	>([]);
	const [haileGroups, setHaileGroups] = useState<buildingGroup[]>([]);
	const [xiaolanBuildings, setXiaolanBuildings] = useState<building[]>([]);
	const [xiaolanLoading, setXiaolanLoading] = useState(true);
	const [xiaolanError, setXiaolanError] = useState(false);
	const [xiaolanReload, setXiaolanReload] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		setXiaolanLoading(true);
		setXiaolanError(false);
		fetchXiaolanBuildings(controller.signal).then((buildings) => {
			if (!controller.signal.aborted) setXiaolanBuildings(buildings);
		}).catch(() => {
			if (!controller.signal.aborted) setXiaolanError(true);
		}).finally(() => {
			if (!controller.signal.aborted) setXiaolanLoading(false);
		});
		return () => controller.abort();
	}, [xiaolanReload]);

	useEffect(() => {
		const controller = new AbortController();
		setFetchedBuildingGroups([]);
		fetchJieliBuildings(controller.signal).then((groups) => {
			if (!controller.signal.aborted) setFetchedBuildingGroups(groups);
		}).catch((error) => {
			if (!controller.signal.aborted) NetworkRetry(error);
		});
		fetchHaileBuildings(controller.signal).then((groups) => {
			if (!controller.signal.aborted) setHaileGroups(groups);
		}).catch((error) => {
			if (!controller.signal.aborted) NetworkRetry(error);
		});
		return () => controller.abort();
	}, []);

	let buildingGroups: buildingGroup[] = [
		...(selectedProvider === "all" || selectedProvider === "jieli" ? fetchedBuildingGroups : []),
		...(selectedProvider === "all" || selectedProvider === "haile" ? haileGroups : []),
		...(selectedProvider === "all" || selectedProvider === "xiaolan"
			? [{name: getStr("xiaolanSmart"), buildings: xiaolanBuildings, xiaolan: true}]
			: []),
	];
	const favouriteBuildings = new Map<string, building>();
	for (const favourite of currentFavourites) {
		const b = favourite.building;
		if (selectedProvider !== "all" && b.provider !== selectedProvider) continue;
		favouriteBuildings.set(`${b.provider}:${b.id}`, b);
	}
	if (favouriteBuildings.size > 0) {
		buildingGroups = [
			{
				name: getStr("favourites"),
				buildings: [...favouriteBuildings.values()],
			},
			...buildingGroups,
		];
	}

	const renderBuildingGroup = ({name, buildings, xiaolan}: buildingGroup) => (
		<View style={{ flexDirection: "column", marginBottom: 32 }}>
			<View style={{ flexDirection: "row", marginHorizontal: 16 }}>
				<View
					style={{
						flex: 1,
						height: 1,
						backgroundColor: theme.colors.primaryLight,
						alignSelf: "center",
					}}
				/>
				<Text
					style={{
						color: theme.colors.primary,
						fontSize: 20,
						margin: 16,
					}}>
					{name}
				</Text>
				<View
					style={{
						flex: 1,
						height: 1,
						backgroundColor: theme.colors.primaryLight,
						alignSelf: "center",
					}}
				/>
			</View>
			{xiaolan && (xiaolanLoading || xiaolanError || buildings.length === 0) && (
				<View style={{alignItems: "center", marginBottom: 16}}>
					<Text style={{color: theme.colors.text}}>
						{getStr(xiaolanLoading ? "loading" : xiaolanError ? "loadFail" : "noData")}
					</Text>
					{xiaolanError && !xiaolanLoading && (
						<TouchableOpacity onPress={() => setXiaolanReload((n) => n + 1)} style={{padding: 12}}>
							<Text style={{color: theme.colors.primary}}>{getStr("washerRetry")}</Text>
						</TouchableOpacity>
					)}
				</View>
			)}
			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					justifyContent: "center",
				}}>
				{buildings.map((item) => (
					<TouchableOpacity
						// Jieli can return different building names with the same ID.
						key={JSON.stringify([item.provider, item.id, item.name])}
						onPress={() => {
							navigation.navigate("WasherDetail", {
								name: item.name,
								id: item.id,
								provider: item.provider,
							});
						}}>
						<View
							style={{
								backgroundColor: theme.colors.contentBackground,
								borderRadius: 8,
								padding: 16,
								marginBottom: 8,
								marginHorizontal: 8,
								width: 170,
							}}>
							<Text
								style={{
									color: theme.colors.text,
									fontSize: 16,
									textAlign: "center",
								}}>
								{item.name}
							</Text>
						</View>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);

	const renderCredit = () => (
		<View style={{ marginHorizontal: 24, marginBottom: 32 }}>
			<Text
				style={{
					color: theme.colors.primary,
					fontSize: 16,
				}}>
				{getStr("washerCredit")}
			</Text>
		</View>
	);

	return (
		<View style={{ backgroundColor: theme.colors.themeBackground, flex: 1 }}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={{flexGrow: 0, flexShrink: 0, marginBottom: 8}}
				contentContainerStyle={{paddingHorizontal: 12, flexGrow: 1}}>
				{WASHER_PROVIDERS.map(({provider, label}) => {
					const selected = selectedProvider === provider;
					return (
						<TouchableOpacity
							key={provider}
							accessibilityRole="tab"
							accessibilityState={{selected}}
							activeOpacity={0.7}
							onPress={() => setSelectedProvider(provider)}
							style={{
								flexGrow: 1,
								minHeight: 52,
								paddingTop: 14,
								paddingBottom: 16,
								paddingHorizontal: 18,
								alignItems: "center",
								justifyContent: "center",
							}}>
							<Text style={{
								color: selected ? theme.colors.primary : theme.colors.fontB2,
								fontSize: 16,
								fontWeight: "600",
								textAlign: "center",
							}}>
								{getStr(label)}
							</Text>
							<View style={{
								position: "absolute",
								bottom: 4,
								width: 24,
								height: 3,
								borderRadius: 2,
								backgroundColor: selected ? theme.colors.primary : "transparent",
							}} />
						</TouchableOpacity>
					);
				})}
			</ScrollView>
			<FlatList
				key={selectedProvider}
				ListFooterComponent={renderCredit()}
				data={buildingGroups}
				renderItem={({ item }) => renderBuildingGroup(item)}
				keyExtractor={(item) => item.name}
			/>
		</View>
	);
};

export type WasherDetailProps = building;

export const WasherDetailScreen = ({ route }: {
	route: { params: WasherDetailProps };
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const [fetchedFloors, setFetchedFloors] = useState<Floor[]>([]);
	const [xiaolanDetail, setXiaolanDetail] = useState<{
		buildingId: string;
		floors: Floor[];
		fetchedAt?: Date;
	}>();
	const [xiaolanLoading, setXiaolanLoading] = useState(true);
	const [xiaolanError, setXiaolanError] = useState(false);
	const [xiaolanReload, setXiaolanReload] = useState(0);
	const {id, provider} = route.params;

	useEffect(() => {
		if (provider !== "xiaolan") return;
		const controller = new AbortController();
		setXiaolanLoading(true);
		setXiaolanError(false);
		fetchXiaolanFloors(id, controller.signal).then((detail) => {
			if (!controller.signal.aborted) setXiaolanDetail({buildingId: id, ...detail});
		}).catch(() => {
			if (!controller.signal.aborted) setXiaolanError(true);
		}).finally(() => {
			if (!controller.signal.aborted) setXiaolanLoading(false);
		});
		return () => controller.abort();
	}, [id, provider, xiaolanReload]);

	const dispatch = useDispatch();
	const currentFavourites = useSelector(
		(s: State) => s.config.washerFavourites ?? [],
	);

	useEffect(() => {
		if (provider === "xiaolan") return;
		const controller = new AbortController();
		setFetchedFloors([]);
		const fetchFloors = provider === "jieli" ? fetchJieliFloors : fetchHaileFloors;
		fetchFloors(id, controller.signal).then((floors) => {
			if (!controller.signal.aborted) setFetchedFloors(floors);
		}).catch((error) => {
			if (!controller.signal.aborted) NetworkRetry(error);
		});
		return () => controller.abort();
	}, [id, provider]);

	const currentDetail = xiaolanDetail?.buildingId === id ? xiaolanDetail : undefined;
	const sourceFloors = provider === "xiaolan" ? currentDetail?.floors ?? [] : fetchedFloors;
	const floors = sourceFloors.map((floor) => ({
		...floor,
		favourite: currentFavourites.some((value) => isWasherFavourite(value, route.params, floor.id ?? floor.name)),
	})).sort((a, b) => Number(b.favourite) - Number(a.favourite));

	const RenderFloor = (
		name: string,
		washers: Washer[],
		favourite: boolean,
		roomId: string,
	) => {
		return (
			<View key={roomId} style={{ flexDirection: "column", marginBottom: 16 }}>
				<View style={{ flexDirection: "row", margin: 16 }}>
					<View
						style={{
							flex: 1,
							height: 1,
							backgroundColor: theme.colors.primaryLight,
							alignSelf: "center",
							margin: 16,
						}}
					/>
					<View
						style={{
							alignSelf: "center",
							marginRight: 8,
							marginBottom: 5,
						}}>
						<IconStarButton
							active={favourite}
							onPress={() => {
								const updatedFavourites = favourite
									? currentFavourites.filter((f) => !isWasherFavourite(f, route.params, roomId))
									: [...currentFavourites, {building: {...route.params}, roomId}];

								dispatch(
									configSet({
										key: "washerFavourites",
										value: updatedFavourites,
									}),
								);
							}}
							size={24}
						/>
					</View>
					<Text
						style={{
							color: theme.colors.primary,
							fontSize: 20,
						}}>
						{name}
					</Text>
					<View
						style={{
							flex: 1,
							height: 1,
							backgroundColor: theme.colors.primaryLight,
							alignSelf: "center",
							margin: 16,
						}}
					/>
				</View>
				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						justifyContent: "center",
					}}>
					{washers.length === 0 && (
						<Text style={{color: theme.colors.text}}>{getStr("noData")}</Text>
					)}
					{washers.map((item) => (
						<View
							key={item.id ?? item.name}
							style={{
								backgroundColor: theme.colors.contentBackground,
								borderRadius: 16,
								padding: 16,
								margin: 8,
								width: 170,
								justifyContent: "center",
							}}>
							<Text
								style={{
									color: theme.colors.text,
									fontSize: 14,
									textAlign: "center",
								}}>
								{(item.location || item.name) + " " + item.type}
							</Text>
							{item.location && (
								<Text
									style={{
										color: theme.colors.fontB2,
										fontSize: 12,
										textAlign: "center",
									}}
								>
									{item.name}
								</Text>
							)}
							<Text
								style={{
									color:
										item.status === "idle"
											? theme.colors.themeGreen
											: item.status === "error"
												? theme.colors.statusError
												: theme.colors.fontB2,
									fontSize: 20,
									textAlign: "center",
									marginVertical: 6,
								}}>
								{item.status === "working" && provider === "jieli"
									? item.eta + " " + getStr("minutesAbbr")
									: getStr(WASHER_STATUS_LABELS[item.status] ?? "washerUnknown")}
							</Text>
							{item.status === "working" && item.estimatedCompleteTime && (
								<Text style={{color: theme.colors.fontB2, fontSize: 12, textAlign: "center"}}>
									{getStr("washerEstimatedEnd") + " " + item.estimatedCompleteTime.toLocaleString()}
								</Text>
							)}
							{provider === "jieli" && item.updateTime && (
								<Text
									style={{
										color: theme.colors.fontB2,
										fontSize: 12,
										marginTop: 2,
										textAlign: "center",
									}}>
									{getStr("updateTime") +
										" " +
										item.updateTime.toTimeString().split(" ")[0]}
								</Text>
							)}
						</View>
					))}
				</View>
			</View>
		);
	};

	return (
		<View style={{ backgroundColor: theme.colors.themeBackground, flex: 1 }}>
			<FlatList
				data={floors}
				keyExtractor={(item) => item.id ?? item.name}
				refreshing={provider === "xiaolan" && xiaolanLoading}
				onRefresh={provider === "xiaolan" ? () => setXiaolanReload((n) => n + 1) : undefined}
				ListHeaderComponent={provider === "xiaolan" ? (
					<View style={{alignItems: "center", padding: 16}}>
						{currentDetail?.fetchedAt && (
							<Text style={{color: theme.colors.fontB2}}>
								{getStr("updateTime") + " " + currentDetail.fetchedAt.toLocaleString()}
							</Text>
						)}
						{xiaolanLoading && <Text style={{color: theme.colors.text}}>{getStr("loading")}</Text>}
						{xiaolanError && !xiaolanLoading && (
							<TouchableOpacity onPress={() => setXiaolanReload((n) => n + 1)} style={{padding: 12}}>
								<Text style={{color: theme.colors.primary}}>
									{getStr(currentDetail ? "washerRefreshFailed" : "loadFail") + " · " + getStr("washerRetry")}
								</Text>
							</TouchableOpacity>
						)}
					</View>
				) : null}
				ListEmptyComponent={provider === "xiaolan" && !xiaolanLoading && !xiaolanError ? (
					<Text style={{color: theme.colors.text, textAlign: "center"}}>{getStr("noData")}</Text>
				) : null}
				renderItem={({ item }) =>
					RenderFloor(
						item.name,
						item.washers,
						item.favourite,
						item.id ?? item.name,
					)
				}
			/>
		</View>
	);
};
