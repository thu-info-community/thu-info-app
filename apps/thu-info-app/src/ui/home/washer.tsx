import { FlatList, ScrollView, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import themes from "../../assets/themes/themes";
import { useEffect, useState } from "react";
import {Snackbar} from "react-native-snackbar";
import { getStr } from "../../utils/i18n";
import type { RootNav } from "../../components/Root";
import { IconStarButton } from "../../components/news/IconStarButton";
import { useDispatch, useSelector } from "react-redux";
import { configSet } from "../../redux/slices/config";
import type { State } from "../../redux/store";
import { NetworkRetry } from "../../components/easySnackbars.ts";
import {
	fetchXiaolanBuildings,
	fetchXiaolanFloors,
	isWasherFavourite,
} from "../../utils/washer";
import type {WasherBuilding as building, Washer, WasherFloor as Floor, WasherProvider} from "../../utils/washer";

interface buildingGroup {
	name: string;
	buildings: building[];
	xiaolan?: boolean;
}

const HAIER_SEARCH_POSITIONS = [
	{ lng: 116.32697, lat: 40.00281 },
	{ lng: 116.3424247, lat: 40.0313472 },
];

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
		let active = true;
		setFetchedBuildingGroups(() => []);

		fetch("https://api.cleverschool.cn/washapi4/device/tower", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: "{}",
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.errorCode != null) {
					Snackbar.show({
						text: res.errorMsg,
						duration: Snackbar.LENGTH_LONG,
					});
				}

				let groups: buildingGroup[] = [
					{ name: getStr("ziJingDorm"), buildings: [] },
					{ name: getStr("nanQuDorm"), buildings: [] },
					{ name: getStr("shuangQingDorm"), buildings: [] },
					{ name: getStr("otherDorm"), buildings: [] },
				];

				for (const b of res.data) {
					if (b.value === "0") {
						continue;
					}

					if (b.text.search("紫荆") !== -1) {
						groups[0].buildings.push({
							name: b.text,
							id: b.value,
							provider: "jieli",
						});
					} else if (b.text.search("南区") !== -1) {
						groups[1].buildings.push({
							name: b.text,
							id: b.value,
							provider: "jieli",
						});
					} else if (b.text.search("双清") !== -1) {
						groups[2].buildings.push({
							name: b.text,
							id: b.value,
							provider: "jieli",
						});
					} else {
						groups[3].buildings.push({
							name: b.text,
							id: b.value,
							provider: "jieli",
						});
					}
				}

				for (const g of groups) {
					g.buildings.sort((a, b) => {
						// First by the number
						const aNumArr = a.name.match(/\d+/g);
						const bNumArr = b.name.match(/\d+/g);

						if (aNumArr !== null && bNumArr !== null) {
							const aNum = parseInt(aNumArr[0], 10);
							const bNum = parseInt(bNumArr[0], 10);
							if (aNum < bNum) {
								return -1;
							} else if (aNum > bNum) {
								return 1;
							}
						}

						if (a.name < b.name) {
							return -1;
						} else if (a.name > b.name) {
							return 1;
						} else {
							return 0;
						}
					});
				}
				if (active) setFetchedBuildingGroups(groups);
			}).catch((e) => { if (active) NetworkRetry(e); });

		// Fetch HaiLeShengHuo buildings
		Promise.all(HAIER_SEARCH_POSITIONS.map((position) =>
			fetch("https://yshz-user.haier-ioc.com/position/nearPosition", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ...position, page: 1, pageSize: 50 }),
			}).then((res) => res.json()),
		)).then((responses) => {
				const buildingsById = new Map<string, building>();

				for (const res of responses) {
					if (res.code !== 0) {
						continue;
					}

					for (const b of res.data.items) {
						if (b.name.search("清华") !== -1 && b.name.search("中学") === -1) {
							const id = String(b.id);
							buildingsById.set(id, {
								name: b.name,
								id,
								provider: "haile",
							});
						}
					}
				}

				const group: buildingGroup = {
					name: getStr("haiLeShengHuo"),
					buildings: [...buildingsById.values()],
				};

				group.buildings.sort((a, b) => {
					if (a.name < b.name) {
						return -1;
					} else if (a.name > b.name) {
						return 1;
					} else {
						return 0;
					}
				});

				if (active) setHaileGroups([group]);
			}).catch((e) => { if (active) NetworkRetry(e); });
		return () => { active = false; };
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

	// Jieli Logic
	useEffect(() => {
		if (route.params.provider !== "jieli") {
			return;
		}
		let active = true;
		setFetchedFloors([]);

		const statusPromise = fetch("https://api.cleverschool.cn/washapi4/device/status", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				towerKey: route.params.id,
			}),
		}).then((res) => res.json());

		// TODO: Write backend and fill API here
		const locationPromise = fetch("https://app.cs.tsinghua.edu.cn/Api/JieliWashers?building=" + route.params.id)
			.then((res) => res.json());

		Promise.allSettled([statusPromise, locationPromise])
			.then(([statusResult, locationResult]) => {
				if (statusResult.status === "rejected") {
					throw statusResult.reason;
				}

				const loc = locationResult.status === "fulfilled" ? locationResult.value : {};

				const res = statusResult.value;
				if (res.errorCode !== null) {
					Snackbar.show({
						text: res.errorMsg,
						duration: Snackbar.LENGTH_LONG,
					});
				}

				const data: { [key: string]: Washer[] } = {};

				for (const item of res.data) {
					if (data[item.floorName] === undefined) {
						data[item.floorName] = [];
					}

					const statusArray = item.status.split(" ");
					let status: "idle" | "working" | "error" = "error";
					let updateTime: Date | null = null;
					let eta: number = 0;

					for (let index = 0; index < statusArray.length; index++) {
						const str = statusArray[index];
						if (str.search("剩余") !== -1) {
							eta = parseInt(str.match(/\d+/g)[0], 10);
						} else if (str.search("更新") !== -1) {
							updateTime = new Date(
								str.split(":")[1] + " " + statusArray[index + 1],
							);
						} else {
							if (str.search("待机") !== -1) {
								status = "idle";
							} else if (
								str.search("工作") !== -1 ||
								str.search("运转") !== -1
							) {
								status = "working";
							}
						}
					}

					const code = item.macUnionCode.split(" ");

					data[item.floorName].push({
						type: code[0],
						name: code[1],
						floor: item.floorName,
						status: status!,
						updateTime: new Date(updateTime!),
						eta: eta,
						location: loc[code[1]] ?? null,
					});
				}

				const updatedFloors: Floor[] = [];

				// First push favourites
				for (const floorName in data) {
					updatedFloors.push({
						name: floorName,
						washers: data[floorName].sort((a, b) => {
							if (a.name < b.name) {
								return -1;
							} else if (a.name > b.name) {
								return 1;
							}

							return 0;
						}),
						favourite: false,
					});
				}

				if (active) setFetchedFloors(updatedFloors);
			}).catch((e) => { if (active) NetworkRetry(e); });
		return () => { active = false; };
	}, [route.params.id, route.params.name, route.params.provider]);

	// Haile Logic
	useEffect(() => {
		if (route.params.provider !== "haile") {
			return;
		}
		let active = true;
		setFetchedFloors([]);

		const fetchData = async () => {
			const floor: Floor = {
				name: "海乐生活",
				washers: [],
				favourite: false,
			};

			const type = {
				"00": "洗衣机",
				"01": "洗鞋机",
				"02": "烘干机",
			};

			const status = {
				1: "idle",
				2: "working",
				3: "error",
			};

			for (const catCode of ["00", "01", "02"]) {
				const rawDetailRes = await fetch("https://yshz-user.haier-ioc.com/position/deviceDetailPage", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"positionId": route.params.id,
						"categoryCode": catCode,
						"page": 1,
						"floorCode": "",
						"pageSize": 100,
					}),
				});

				const detail = await rawDetailRes.json();

				if (detail.code !== 0) {
					continue;
				}

				for (const w of detail.data.items) {
					floor.washers.push({
						type: type[catCode as "00" | "01" | "02"],
						name: w.name,
						floor: floor.name,
						status: status[w.state as 1 | 2 | 3] as "idle" | "working" | "error",
						eta: -1,
						updateTime: new Date(),
					});
				}
			}

			floor.washers.sort((a, b) => {
				if (a.name < b.name) {
					return -1;
				} else if (a.name > b.name) {
					return 1;
				}
				return 0;
			});

			if (active) setFetchedFloors([floor]);
		};

		fetchData().catch((e) => {
			if (active) NetworkRetry(e);
		});
		return () => { active = false; };
	}, [route.params.id, route.params.name, route.params.provider]);

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
