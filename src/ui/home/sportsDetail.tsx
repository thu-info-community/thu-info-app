import {useEffect, useState} from "react";
import {RootNav, SportsDetailProp} from "../../components/Root";
import {helper} from "../../redux/store";
import {
	Alert,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {NetworkRetry} from "../../components/easySnackbars";
import dayjs from "dayjs";
import {RoundedView} from "../../components/views";

interface TimePeriod {
	description: string;
	total: number;
	availableFields: {id: string; name: string; cost: number}[];
}

export const SportsDetailScreen = ({
	route,
	navigation,
}: {
	navigation: RootNav;
	route: SportsDetailProp;
}) => {
	const [dateSelected, setDateSelected] = useState<string | undefined>(
		undefined,
	);
	const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined);
	const [resources, setResources] = useState<TimePeriod[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const today = dayjs();
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const validDateNum = 4;
	const format = "YYYY-MM-DD";

	const refresh = () => {
		if (dateSelected === undefined) {
			return;
		}
		setRefreshing(true);
		setResources([]);
		helper
			.getSportsResources(
				route.params.info.gymId,
				route.params.info.itemId,
				dateSelected,
			)
			.then(({data, init, count, phone}) => {
				setPhoneNumber(phone);
				if (init <= 0) {
					Alert.alert(getStr("failure"), getStr("sportsBookUnavailable"));
					setResources([]);
				} else if (count === 0) {
					Alert.alert(
						getStr("failure"),
						getStr("sportsBookRestricted").replace("%d", String(init)),
					);
					setResources([]);
				} else {
					const result: {[key: string]: TimePeriod} = {};
					for (let {
						timeSession,
						locked,
						userType,
						resHash,
						fieldName,
						cost,
					} of data) {
						if (result[timeSession] === undefined) {
							result[timeSession] = {
								description: timeSession,
								total: 0,
								availableFields: [],
							};
						}
						++result[timeSession].total;
						if (locked !== true && userType === undefined) {
							result[timeSession].availableFields.push({
								id: resHash,
								name: fieldName,
								cost: cost ?? 0,
							});
						}
					}
					setResources(Object.values(result));
				}
			})
			.catch(NetworkRetry)
			.then(() => {
				setRefreshing(false);
			});
	};

	useEffect(() => {
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dateSelected]);

	return (
		<ScrollView
			style={{flex: 1}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}>
			<RoundedView
				style={{marginHorizontal: 12, marginVertical: 24, padding: 16}}>
				{Array.from(new Array(validDateNum), (_, k) => today.add(k, "day")).map(
					(date, index) => (
						<View key={date.format(format)}>
							{index > 0 && (
								<View
									style={{
										borderWidth: 0.4,
										borderColor: colors.themeGrey,
										marginVertical: 12,
									}}
								/>
							)}
							<TouchableOpacity
								onPress={() => setDateSelected(date.format(format))}
								style={{
									flexDirection: "row",
									alignItems: "center",
								}}>
								<Text
									style={{
										color: colors.text,
										fontSize: 16,
										lineHeight: 24,
									}}>
									{date.format(format)} {getStr("dayOfWeek")[date.day()]}
								</Text>
							</TouchableOpacity>
							{date.format(format) === dateSelected &&
								resources.map((item) => (
									<View key={`${date.format(format)}-r-${item.description}`}>
										<View
											style={{
												borderWidth: 0.4,
												borderColor: colors.themeGrey,
												marginVertical: 12,
											}}
										/>
										<TouchableOpacity
											onPress={() =>
												navigation.navigate("SportsSelectField", {
													info: route.params.info,
													date: date.format(format),
													phone: phoneNumber ?? "",
													period: item.description,
													availableFields: item.availableFields,
												})
											}
											disabled={item.availableFields.length === 0}>
											<Text
												style={{
													marginLeft: 16,
													color:
														item.availableFields.length === 0
															? colors.fontB3
															: colors.text,
													fontSize: 16,
													lineHeight: 24,
												}}>
												{item.description} ({item.availableFields.length}/
												{item.total})
											</Text>
										</TouchableOpacity>
									</View>
								))}
						</View>
					),
				)}
			</RoundedView>
		</ScrollView>
	);
};
