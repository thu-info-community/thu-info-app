import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import {
	FlatList,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import {useEffect, useRef, useState} from "react";
import {ClassroomDetailRouteProp} from "../../components/Root";
import {getStr} from "../../utils/i18n";
import {Snackbar} from "react-native-snackbar";
import IconLeft from "../../assets/icons/IconLeft";
import IconRight from "../../assets/icons/IconRight";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {helper} from "../../redux/store";
import dayjs from "dayjs";
import {BottomPopupTriggerView} from "../../components/views";
import {explainWeekAndDay} from "../../utils/calendar";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import {
	ClassroomState,
	ClassroomStatus,
} from "@thu-info/lib/src/models/home/classroom";

const ClassroomStatusCell = ({
	status,
	index,
	upcoming,
	showTip,
	onPress,
	theme,
}: {
	status: ClassroomStatus;
	index: number;
	upcoming: boolean;
	showTip: boolean;
	onPress: () => void;
	theme: ReturnType<typeof themes>;
}) => {
	return (
		<TouchableWithoutFeedback key={index} onPress={onPress}>
			<View
				style={{
					flex: 1,
					height: 26,
					margin: 2,
					backgroundColor:
						status === ClassroomStatus.AVAILABLE
							? upcoming
								? theme.colors.themeDarkGrey
								: theme.colors.themeGrey
							: upcoming
								? theme.colors.themePurple
								: theme.colors.themeTransparentPurple,
				}}>
				{showTip && (
					<View
						style={{
							position: "absolute",
							bottom: "100%",
							left: 0,
							right: 0,
							alignItems:
								index === 0
									? "flex-start"
									: index === 5
										? "flex-end"
										: "center",
						}}>
						<Text
							style={{
								minWidth: 26,
								minHeight: 14,
								textAlign: "center",
								color: theme.colors.contentBackground,
								backgroundColor: theme.colors.fontB1,
								fontSize: 9,
								padding: 1,
							}}>
							{getStr("classroomStatus")[status]}
						</Text>
					</View>
				)}
			</View>
		</TouchableWithoutFeedback>
	);
};

const ClassroomStatusRow = ({
	item: {name, status},
	classroomIndex,
	day,
	currentPeriod,
	tipItem,
	onToggleTip,
	theme,
}: {
	item: ClassroomState;
	classroomIndex: number;
	day: number;
	currentPeriod: number;
	tipItem: {row: number; col: number};
	onToggleTip: (row: number, col: number) => void;
	theme: ReturnType<typeof themes>;
}) => {
	return (
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
					flex: 2,
					textAlign: "center",
					fontSize: 16,
					color: theme.colors.text,
				}}>
				{name.split(":")[1].replace("(人)", "")}
			</Text>
			<View style={{flex: 5, flexDirection: "row"}}>
				{Array.from({length: 6}, (_, index) => (
					<ClassroomStatusCell
						theme={theme}
						key={index}
						status={status[(day - 1) * 6 + index]}
						index={index}
						upcoming={index + 1 >= currentPeriod}
						showTip={tipItem.row === classroomIndex && tipItem.col === index}
						onPress={() => onToggleTip(classroomIndex, index)}
					/>
				))}
			</View>
		</View>
	);
};

const ClassroomStatusHeader = ({
	currentPeriod,
	theme,
}: {
	currentPeriod: number;
	theme: ReturnType<typeof themes>;
}) => {
	return (
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
			<View style={{flex: 2}}>
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
	);
};

export const ClassroomDetailScreen = ({
	route: {
		params: {searchName, weekNumber},
	},
}: {
	route: ClassroomDetailRouteProp;
}) => {
	const current = dayjs();
	const dayOfWeek = current.day() === 0 ? 7 : current.day();

	const [validWeeks, setValidWeeks] = useState<number[]>([weekNumber]);
	const [dates, setDates] = useState<string[]>([]);
	const [data, setData] = useState<[number, number, ClassroomState[]]>([
		Math.max(weekNumber, 1),
		dayOfWeek,
		[],
	]);
	const prev = useRef<[number, ClassroomState[], string[]]>();
	const next = useRef<[number, ClassroomState[], string[]]>();
	const currWeek = data[0];
	const currDay = data[1];
	const [refreshing, setRefreshing] = useState(false);

	const [popupWeek, setPopupWeek] = useState(Math.max(weekNumber, 1));
	const [popupDayOfWeek, setPopupDayOfWeek] = useState(dayOfWeek);

	const [tipItem, setTipItem] = useState({row: -1, col: -1});

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
		setDates([]);
		helper
			.getClassroomState(searchName, currWeek)
			.then(({validWeekNumbers, datesOfCurrentWeek, classroomStates}) => {
				setData((o) => {
					if (o[0] === data[0]) {
						setRefreshing(false);
						return [o[0], o[1], classroomStates];
					} else {
						return o;
					}
				});
				setValidWeeks(validWeekNumbers);
				setDates(datesOfCurrentWeek);
			})
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			);
	};

	useEffect(() => {
		if (prev.current && data[0] === prev.current[0]) {
			next.current = [data[0] + 1, data[2], dates];
			setData([data[0], data[1], prev.current[1]]);
			setDates(prev.current[2]);
			prev.current = undefined;
		} else if (next.current && data[0] === next.current[0]) {
			prev.current = [data[0] - 1, data[2], dates];
			setData([data[0], data[1], next.current[1]]);
			setDates(next.current[2]);
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
				.then(
					({datesOfCurrentWeek, classroomStates}) =>
						(prev.current = [data[0] - 1, classroomStates, datesOfCurrentWeek]),
				);
		}
		if (next.current === undefined || next.current[0] !== data[0] + 1) {
			helper
				.getClassroomState(searchName, data[0] + 1)
				.then(
					({datesOfCurrentWeek, classroomStates}) =>
						(next.current = [data[0] + 1, classroomStates, datesOfCurrentWeek]),
				);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currWeek]);

	useEffect(() => {
		setTipItem({row: -1, col: -1});
	}, [currDay]);

	const toggleTip = (row: number, col: number) => {
		setTipItem((old) =>
			old.row === row && old.col === col ? {row: -1, col: -1} : {row, col},
		);
	};

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
					style={{padding: 2}}
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
				<BottomPopupTriggerView
					popupTitle={explainWeekAndDay(popupWeek, popupDayOfWeek)}
					popupContent={
						<View style={{flexDirection: "row"}}>
							<ScrollPicker
								dataSource={validWeeks.map(
									(week) =>
										getStr("weekNumPrefix") + week + getStr("weekNumSuffix"),
								)}
								selectedIndex={popupWeek - 1}
								renderItem={(text) => (
									<Text
										style={{color: theme.colors.fontB1, fontSize: 20}}
										key={text}>
										{text}
									</Text>
								)}
								onValueChange={(_, selectedIndex) => {
									setPopupWeek(selectedIndex + 1);
								}}
								wrapperHeight={200}
								wrapperBackground={theme.colors.contentBackground}
								itemHeight={48}
								highlightColor={theme.colors.themeGrey}
								highlightBorderWidth={1}
							/>
							<ScrollPicker
								dataSource={Array.from(
									new Array(7),
									(_, k) => getStr("dayOfWeek")[k + 1],
								)}
								selectedIndex={popupDayOfWeek - 1}
								renderItem={(text) => (
									<Text
										style={{color: theme.colors.fontB1, fontSize: 20}}
										key={text}>
										{text}
									</Text>
								)}
								onValueChange={(_, selectedIndex) => {
									setPopupDayOfWeek(selectedIndex + 1);
								}}
								wrapperHeight={200}
								wrapperBackground={theme.colors.contentBackground}
								itemHeight={48}
								highlightColor={theme.colors.themeGrey}
								highlightBorderWidth={1}
							/>
						</View>
					}
					popupCanFulfill={true}
					popupOnFulfilled={() => {
						setData(([_week, _day, table]) => [
							popupWeek,
							popupDayOfWeek,
							table,
						]);
					}}
					popupOnCancelled={() => {}}>
					<Text
						style={{
							fontSize: 16,
							marginHorizontal: 11,
							color: theme.colors.text,
						}}>
						{explainWeekAndDay(data[0], data[1])} {dates[data[1] - 1]}
					</Text>
				</BottomPopupTriggerView>
				<TouchableOpacity
					style={{padding: 2}}
					onPress={() =>
						setData(([week, day, table]) =>
							day < 7 ? [week, day + 1, table] : [week + 1, 1, table],
						)
					}>
					<IconRight height={24} width={24} />
				</TouchableOpacity>
			</View>
			<FlatList
				refreshControl={
					<ThemedRefreshControl refreshing={refreshing} onRefresh={refresh} />
				}
				style={{
					marginHorizontal: 16,
					marginTop: 27,
				}}
				ListHeaderComponent={
					<ClassroomStatusHeader currentPeriod={currentPeriod} theme={theme} />
				}
				data={data[2]}
				initialNumToRender={30}
				renderItem={({item, index}) => (
					<ClassroomStatusRow
						theme={theme}
						item={item}
						classroomIndex={index}
						day={data[1]}
						currentPeriod={currentPeriod}
						tipItem={tipItem}
						onToggleTip={toggleTip}
					/>
				)}
			/>
		</View>
	);
};
