import {
	FlatList,
	RefreshControl,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {CrCoursePlanRouteProp, RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {CrTimeoutError} from "thu-info-lib/dist/utils/error";
import {CoursePlan} from "thu-info-lib/dist/models/cr/cr";
import {SettingsLargeButton} from "../../components/settings/items";

export const CrCoursePlanScreen = ({
	route,
	navigation,
}: {
	route: CrCoursePlanRouteProp;
	navigation: RootNav;
}) => {
	const [coursePlan, setCoursePlan] = useState<CoursePlan[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [searchKey, setSearchKey] = useState("");

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getCrCoursePlan(route.params.semesterId)
			.then(setCoursePlan)
			.catch((e) => {
				if (e instanceof CrTimeoutError) {
					navigation.navigate("CrCaptcha");
				} else {
					Snackbar.show({
						text: getStr("networkRetry") + e?.message,
						duration: Snackbar.LENGTH_SHORT,
					});
				}
			})
			.then(() => setRefreshing(false));
	};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(refresh, []);

	return (
		<FlatList
			style={{flex: 1}}
			data={coursePlan}
			ListHeaderComponent={
				<View style={{flexDirection: "row"}}>
					<TextInput
						value={searchKey}
						onChangeText={setSearchKey}
						style={{
							flex: 3,
							marginLeft: 12,
							textAlignVertical: "center",
							fontSize: 15,
							paddingHorizontal: 12,
							backgroundColor: colors.themeBackground,
							color: colors.text,
							borderColor: colors.inputBorder,
							borderWidth: 1,
							borderRadius: 5,
						}}
						placeholder={getStr("searchCourseName")}
						placeholderTextColor={colors.fontB3}
					/>
					<SettingsLargeButton
						text={getStr("search")}
						onPress={() => {
							navigation.navigate("CrSearchResult", {
								searchParams: {
									semester: route.params.semesterId,
									name: searchKey,
								},
							});
						}}
						disabled={searchKey.length === 0}
						redText={false}
					/>
				</View>
			}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}
			renderItem={({item: {id, name, property, credit, group}}) => (
				<TouchableOpacity
					style={{
						paddingHorizontal: 15,
						paddingVertical: 6,
						flexDirection: "row",
						justifyContent: "space-between",
					}}
					onPress={() => {
						navigation.navigate("CrSearchResult", {
							searchParams: {semester: route.params.semesterId, id},
						});
					}}>
					<View style={{flex: 2, alignItems: "flex-start"}}>
						<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
							[{property}] {name}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{id} ({credit} cr)
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>{group}</Text>
					</View>
				</TouchableOpacity>
			)}
			keyExtractor={({id}) => id}
		/>
	);
};
