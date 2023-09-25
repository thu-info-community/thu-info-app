import {
	FlatList,
	useColorScheme,
	View,
	Text,
	TouchableOpacity,
} from "react-native";
import themes from "../../assets/themes/themes";
import {useEffect, useState} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import {it} from "@jest/globals";
import {stat} from "react-native-fs";
import {IconStarButton} from "../../components/news/IconStarButton";

interface building {
	name: string;
	id: string;
}

interface buildingGroup {
	name: string;
	buildings: building[];
}

export const WasherScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const [buildingGroups, setBuildingGroups] = useState<buildingGroup[]>([]);

	useEffect(() => {
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

				const buildingGroups: buildingGroup[] = [
					{name: getStr("ziJingDorm"), buildings: []},
					{name: getStr("nanQuDorm"), buildings: []},
					{name: getStr("shuangQingDorm"), buildings: []},
					{name: getStr("otherDorm"), buildings: []},
				];

				for (const b of res.data) {
					if (b.value === "0") {
						continue;
					}

					if (b.text.search("紫荆") !== -1) {
						buildingGroups[0].buildings.push({
							name: b.text,
							id: b.value,
						});
					} else if (b.text.search("南区") !== -1) {
						buildingGroups[1].buildings.push({
							name: b.text,
							id: b.value,
						});
					} else if (b.text.search("双清") !== -1) {
						buildingGroups[2].buildings.push({
							name: b.text,
							id: b.value,
						});
					} else {
						buildingGroups[3].buildings.push({
							name: b.text,
							id: b.value,
						});
					}
				}

				for (const g of buildingGroups) {
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

				setBuildingGroups(buildingGroups);
			});
	}, []);

	const renderBuildingGroup = (name: string, buildings: building[]) => (
		<View style={{flexDirection: "column", marginBottom: 32}}>
			<View style={{flexDirection: "row", marginHorizontal: 16}}>
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
			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					justifyContent: "center",
				}}>
				{buildings.map((item) => (
					<TouchableOpacity
						key={item.name}
						onPress={() => {
							navigation.navigate("WasherDetail", {
								name: item.name,
								id: item.id,
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

	return (
		<View style={{backgroundColor: theme.colors.themeBackground, flex: 1}}>
			<FlatList
				data={buildingGroups}
				renderItem={({item}) => renderBuildingGroup(item.name, item.buildings)}
				keyExtractor={(item) => item.name}
			/>
		</View>
	);
};

export interface WasherDetailProps {
	name: string;
	id: string;
}

interface Washer {
	name: string;
	floor: string;
	status: "idle" | "working" | "error";
	eta: number;
	updateTime: Date;
}

interface Floor {
	name: string;
	washers: Washer[];
	favourite: boolean;
}

export const WasherDetailScreen = ({
	route,
}: {
	route: {params: WasherDetailProps};
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const [floors, setFloors] = useState<Floor[]>([]);

	useEffect(() => {
		const buildingId = route.params.id;
		fetch("https://api.cleverschool.cn/washapi4/device/status", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				towerKey: buildingId,
			}),
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.errorCode !== null) {
					Snackbar.show({
						text: res.errorMsg,
						duration: Snackbar.LENGTH_LONG,
					});
				}

				const data: {[key: string]: Washer[]} = {};

				for (const item of res.data) {
					if (data[item.floorName] === undefined) {
						data[item.floorName] = [];
					}

					const statusArray = item.status.split(" ");
					let status: "idle" | "working" | "error" | null = null;
					let updateTime: Date | null = null;
					let eta: number = 0;

					for (let index = 0; index < statusArray.length; index++) {
						const str = statusArray[index];
						if (str.search("状态") !== -1) {
							if (str.search("待机") !== -1) {
								status = "idle";
							} else if (
								str.search("工作") !== -1 ||
								str.search("运转") !== -1
							) {
								status = "working";
							} else {
								status = "error";
							}
						} else if (str.search("剩余") !== -1) {
							eta = parseInt(str.match(/\d+/g)[0], 10);
						} else if (str.search("更新") !== -1) {
							updateTime = new Date(
								str.split(":")[1] + " " + statusArray[index + 1],
							);
						}
					}

					data[item.floorName].push({
						name: item.macUnionCode,
						floor: item.floorName,
						status: status!,
						updateTime: new Date(updateTime!),
						eta: eta,
					});
				}

				const floors: Floor[] = [];
				for (const floorName in data) {
					floors.push({
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

				setFloors(floors);
			});
	}, [route.params.id]);

	const renderFloor = (name: string, washers: Washer[], favourite: boolean) => {
		return (
			<View key={name} style={{flexDirection: "column", marginBottom: 32}}>
				<View style={{flexDirection: "row", margin: 16}}>
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
						<IconStarButton active={favourite} onPress={() => {}} size={24} />
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
					{washers.map((item) => (
						<View
							key={item.name}
							style={{
								backgroundColor: theme.colors.contentBackground,
								borderRadius: 24,
								padding: 24,
								margin: 8,
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
							<Text
								style={{
									color:
										item.status === "idle"
											? theme.colors.themeGreen
											: item.status === "working"
											? theme.colors.fontB2
											: theme.colors.statusError,
									fontSize: 24,
									textAlign: "center",
									marginVertical: 8,
								}}>
								{item.status === "idle"
									? "空闲"
									: item.status === "working"
									? item.eta + " 分钟"
									: "故障"}
							</Text>
							<Text
								style={{
									color: theme.colors.fontB2,
									fontSize: 16,
									textAlign: "center",
								}}>
								{item.updateTime.toTimeString().split(" ")[0]} 更新
							</Text>
						</View>
					))}
				</View>
			</View>
		);
	};

	return (
		<View style={{backgroundColor: theme.colors.themeBackground}}>
			<FlatList
				data={floors}
				renderItem={({item}) =>
					renderFloor(item.name, item.washers, item.favourite)
				}
			/>
		</View>
	);
};
