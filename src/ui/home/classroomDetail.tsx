import {
	Dimensions,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import {useEffect, useRef, useState} from "react";
import {ClassroomDetailRouteProp} from "../../components/Root";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import IconLeft from "../../assets/icons/IconLeft";
import IconRight from "../../assets/icons/IconRight";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {helper} from "../../redux/store";
import dayjs from "dayjs";

export const ClassroomDetailScreen = ({
	route: {
		params: {searchName, weekNumber},
	},
}: {
	route: ClassroomDetailRouteProp;
}) => {
	const weekCount = 18;
	const current = dayjs();
	const dayOfWeek = current.day() === 0 ? 7 : current.day();

	const [data, setData] = useState<[number, number, [string, number[]][]]>([
		Math.max(weekNumber, 1),
		dayOfWeek,
		[],
	]);
	const prev = useRef<[number, [string, number[]][]]>();
	const next = useRef<[number, [string, number[]][]]>();
	const currWeek = data[0];
	const currDay = data[1];
	const [refreshing, setRefreshing] = useState(false);

	const [statesLayoutX, setStatesLayoutX] = useState<number | undefined>();
	const [tipPosition, setTipPosition] = useState<
		{top: number; left: number} | undefined
	>();
	const [tipItem, setTipItem] = useState({row: -1, col: -1});
	const [tipState, setTipState] = useState(0);
	const [tipWidth, setTipWidth] = useState(26);

	const currentTime = current.format("HHmm");
	const currentPeriod = (() => {
		if (
			weekNumber < data[0] ||
			(weekNumber === data[0] && dayOfWeek < data[1])
		) {
			return 1;
		} else if (
			weekNumber > data[0] ||
			(weekNumber === data[0] && dayOfWeek > data[1])
		) {
			return 7;
		} else if (currentTime < "0935") {
			return 1;
		} else if (currentTime < "1215") {
			return 2;
		} else if (currentTime < "1505") {
			return 3;
		} else if (currentTime < "1655") {
			return 4;
		} else if (currentTime < "1840") {
			return 5;
		} else if (currentTime < "2145") {
			return 6;
		} else {
			return 7;
		}
	})();

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getClassroomState(searchName, currWeek)
			.then((res) =>
				setData((o) => {
					if (o[0] === data[0]) {
						setRefreshing(false);
						return [o[0], o[1], res];
					} else {
						return o;
					}
				}),
			)
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			);
	};

	useEffect(() => {
		if (prev.current && data[0] === prev.current[0]) {
			next.current = [data[0] + 1, data[2]];
			setData([data[0], data[1], prev.current[1]]);
			prev.current = undefined;
		} else if (next.current && data[0] === next.current[0]) {
			prev.current = [data[0] - 1, data[2]];
			setData([data[0], data[1], next.current[1]]);
			next.current = undefined;
		} else {
			refresh();
		}
		if (
			data[0] > 1 &&
			(prev.current === undefined || prev.current[0] !== data[0] - 1)
		) {
			helper
				.getClassroomState(searchName, data[0] - 1)
				.then((res) => (prev.current = [data[0] - 1, res]));
		}
		if (
			data[0] < weekCount &&
			(next.current === undefined || next.current[0] !== data[0] + 1)
		) {
			helper
				.getClassroomState(searchName, data[0] + 1)
				.then((res) => (next.current = [data[0] + 1, res]));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currWeek]);

	useEffect(() => {
		setTipItem({row: -1, col: -1});
		setTipPosition(undefined);
	}, [currDay]);

	return (
		<View style={{backgroundColor: theme.colors.contentBackground, flex: 1}}>
			<View
				style={{
					justifyContent: "center",
					alignItems: "center",
					flexDirection: "row",
					marginTop: 12,
				}}>
				<TouchableOpacity
					onPress={() =>
						setData(([week, day, table]) =>
							day > 1
								? [week, day - 1, table]
								: week > 1
								? [week - 1, 7, table]
								: [week, day, table],
						)
					}
					disabled={data[0] === 1 && data[1] === 1}>
					<IconLeft height={24} width={24} />
				</TouchableOpacity>
				<Text
					style={{
						fontSize: 16,
						marginHorizontal: 11,
						color: theme.colors.text,
					}}>
					{getStr("classroomHeaderPrefix") +
						data[0] +
						getStr("classroomHeaderMiddle") +
						getStr("dayOfWeek")[data[1]]}
				</Text>
				<TouchableOpacity
					onPress={() =>
						setData(([week, day, table]) =>
							day < 7
								? [week, day + 1, table]
								: week < weekCount
								? [week + 1, 1, table]
								: [week, day, table],
						)
					}
					disabled={data[0] === weekCount && data[1] === 7}>
					<IconRight height={24} width={24} />
				</TouchableOpacity>
			</View>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				style={{
					marginHorizontal: 16,
					marginTop: 27,
				}}>
				<View
					style={{
						flexDirection: "row",
						marginBottom: 8,
					}}>
					<Text
						style={{
							flex: 3,
							fontSize: 14,
							color: theme.colors.fontB2,
						}}>
						{getStr("classroomName")}
					</Text>
					<View style={{flex: 1, marginRight: 41}}>
						<Text
							style={{
								textAlign: "center",
								fontSize: 14,
								color: theme.colors.fontB2,
							}}>
							{getStr("classroomCapacity")}
						</Text>
						<Text
							style={{
								textAlign: "center",
								fontSize: 11,
								marginTop: 4,
								color: theme.colors.fontB3,
							}}>
							（人）
						</Text>
					</View>
					<View style={{flex: 5}}>
						<Text
							style={{
								textAlign: "center",
								fontSize: 14,
								marginBottom: 4,
								color: theme.colors.fontB2,
							}}>
							{getStr("classroomCondition")}
						</Text>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
							}}>
							{[1, 2, 3, 4, 5, 6].map((val) => (
								<Text
									key={val}
									style={{
										flex: 1,
										textAlign: "center",
										fontSize: 11,
										color:
											val >= currentPeriod
												? theme.colors.fontB1
												: theme.colors.fontB3,
									}}>
									{val}
								</Text>
							))}
						</View>
					</View>
				</View>
				<View>
					{data[2].map(([name, states], classroomIndex) => (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
							}}
							key={name}>
							<Text
								style={{
									flex: 3,
									fontSize: 16,
									color: theme.colors.text,
								}}>
								{name.split(":")[0]}
							</Text>
							<Text
								style={{
									flex: 1,
									marginRight: 41,
									textAlign: "center",
									fontSize: 16,
									color: theme.colors.text,
								}}>
								{name.split(":")[1].replace("(人)", "")}
							</Text>
							<View
								style={{flex: 5, flexDirection: "row"}}
								onLayout={(e) => {
									if (classroomIndex === 0) {
										setStatesLayoutX(e.nativeEvent.layout.x);
									}
								}}>
								{Array.from(new Array(6)).map((_, index) => (
									<TouchableWithoutFeedback
										onPress={() => {
											if (statesLayoutX !== undefined) {
												if (
													tipItem.row !== classroomIndex ||
													tipItem.col !== index
												) {
													const totalWidth =
														Dimensions.get("window").width - 32 - statesLayoutX;
													const elementWidth = totalWidth / 6;
													const top = classroomIndex * 30;
													const left =
														statesLayoutX + elementWidth * (index + 0.5);
													setTipPosition({top, left});
													setTipItem({row: classroomIndex, col: index});
													setTipState(states[(data[1] - 1) * 6 + index]);
												} else {
													setTipPosition(undefined);
													setTipItem({row: -1, col: -1});
												}
											}
										}}
										key={index}>
										<View
											style={{
												backgroundColor:
													states[(data[1] - 1) * 6 + index] === 5
														? index + 1 >= currentPeriod
															? theme.colors.themePurple
															: theme.colors.themeTransparentPurple
														: index + 1 >= currentPeriod
														? theme.colors.themeDarkGrey
														: theme.colors.themeGrey,
												flex: 1,
												height: 26,
												margin: 2,
											}}
										/>
									</TouchableWithoutFeedback>
								))}
							</View>
						</View>
					))}
					{tipPosition !== undefined && (
						<View
							style={{
								position: "absolute",
								left: tipPosition.left - tipWidth / 2,
								top: tipPosition.top - 14,
								alignItems: "center",
							}}>
							<Text
								onLayout={(e) => {
									const {width} = e.nativeEvent.layout;
									setTipWidth((oldWidth) => {
										if (Math.abs(width - oldWidth) < 2) {
											return oldWidth;
										} else {
											return width;
										}
									});
								}}
								style={{
									minWidth: 26,
									height: 14,
									textAlign: "center",
									color: theme.colors.contentBackground,
									backgroundColor: theme.colors.fontB1,
									fontSize: 9,
									padding: 1,
								}}>
								{getStr("classroomStatus")[tipState]}
							</Text>
							<View
								style={{
									position: "absolute",
									top: 13,
									width: 0,
									height: 0,
									borderLeftWidth: 4,
									borderRightWidth: 4,
									borderTopWidth: 4,
									borderTopColor: theme.colors.fontB1,
									borderLeftColor: "transparent",
									borderRightColor: "transparent",
									borderBottomColor: "transparent",
								}}
							/>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
};
