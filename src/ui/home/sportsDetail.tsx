import React, {useEffect, useState} from "react";
import {RootNav, SportsDetailProp} from "../../components/Root";
import {helper} from "../../redux/store";
import {
	Alert,
	FlatList,
	RefreshControl,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import themes from "../../assets/themes/themes";
import {NetworkRetry} from "../../components/easySnackbars";

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
	const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined);
	const [phoneInput, setPhoneInput] = useState("");
	const [resources, setResources] = useState<TimePeriod[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getSportsResources(
				route.params.info.gymId,
				route.params.info.itemId,
				route.params.date,
			)
			.then(({data, init, count, phone}) => {
				setPhoneInput(phone ?? "");
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
				} else if (phone === undefined) {
					Alert.alert(getStr("sportsBookPhoneRequired"));
					setResources([]);
				} else {
					const result: {[key: string]: TimePeriod} = {};
					for (let {
						timeSession,
						locked,
						userType,
						resId,
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
								id: resId,
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
	}, []);

	return (
		<>
			<View
				style={{
					paddingHorizontal: 18,
					flexDirection: "row",
					alignItems: "center",
					borderBottomWidth: 1,
					borderBottomColor: "lightgrey",
				}}>
				<Text style={{color: colors.text}}>{getStr("pleaseEnterPhone")}</Text>
				<TextInput
					style={{flex: 1}}
					value={phoneInput}
					onChangeText={setPhoneInput}
					textContentType="telephoneNumber"
					keyboardType="number-pad"
				/>
				<TouchableOpacity
					style={{backgroundColor: "lightgrey", padding: 10}}
					onPress={() => {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						const phoneCopy = phoneInput;
						helper
							.updateSportsPhoneNumber(phoneCopy)
							.then(() => {
								Snackbar.show({
									text: getStr("sportsPhoneSetSucceed"),
									duration: Snackbar.LENGTH_SHORT,
								});
								setPhoneNumber(phoneCopy);
							})
							.catch(() =>
								Snackbar.show({
									text: getStr("sportsPhoneSetFail"),
									duration: Snackbar.LENGTH_SHORT,
								}),
							);
					}}>
					<Text style={{color: "black"}}>{getStr("confirm")}</Text>
				</TouchableOpacity>
			</View>
			<FlatList
				style={{flex: 1}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[colors.accent]}
					/>
				}
				data={resources}
				renderItem={({item, index}) => (
					<View
						style={{
							borderTopColor: "lightgrey",
							borderTopWidth: 1,
							borderBottomColor: "lightgrey",
							borderBottomWidth: index === resources.length - 1 ? 1 : 0,
						}}>
						<TouchableOpacity
							onPress={() =>
								navigation.navigate("SportsSelect", {
									info: route.params.info,
									date: route.params.date,
									phone: phoneNumber ?? "",
									availableFields: item.availableFields,
								})
							}
							disabled={item.availableFields.length === 0}>
							<Text
								style={{
									padding: 10,
									textDecorationLine:
										item.availableFields.length === 0 ? "line-through" : "none",
									color:
										item.availableFields.length === 0
											? "lightgrey"
											: colors.text,
								}}>
								{item.description} ({item.availableFields.length}/{item.total})
							</Text>
						</TouchableOpacity>
					</View>
				)}
				keyExtractor={({description}) => description}
			/>
		</>
	);
};
