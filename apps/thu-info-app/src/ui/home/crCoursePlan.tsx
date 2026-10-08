import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import {
	FlatList,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import {NetworkRetry} from "../../components/easySnackbars";
import {helper} from "../../redux/store";
import {CrCoursePlanRouteProp, RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {CoursePlan} from "@thu-info/lib/src/models/cr/cr";
import {ThemedTextInput} from "../../components/subpage/fields";
import {PrimaryButton} from "../../components/subpage/buttons";
import {Separator} from "../../components/subpage/rows";
import {
	radius,
	roundedListContent,
	spacing,
} from "../../components/subpage/tokens";

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
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};
	useEffect(refresh, [route.params.semesterId]);

	return (
		<KeyboardAvoidingScreen>
			<FlatList
				style={{flex: 1, margin: spacing.md}}
				data={coursePlan}
				contentContainerStyle={roundedListContent(colors, true)} // sheet carries the search row
				ListHeaderComponent={
					<View style={{flexDirection: "row"}}>
						<ThemedTextInput
							value={searchKey}
							onChangeText={setSearchKey}
							style={{
								flex: 3,
								marginLeft: 12,
								textAlignVertical: "center",
								fontSize: 15,
								paddingHorizontal: 12,
								backgroundColor: colors.themeBackground,
								borderColor: colors.inputBorder,
								borderWidth: 1,
								borderRadius: radius.control,
							}}
							placeholder={getStr("searchCourseName")}
						/>
						<PrimaryButton
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
						/>
					</View>
				}
				refreshControl={
					<ThemedRefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
					/>
				}
				renderItem={({item: {id, name, property, credit, group}, index}) => (
					<>
						{index > 0 && <Separator style={{marginHorizontal: 0}} />}
						<TouchableOpacity
							style={{
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
								<Text style={{color: colors.fontB2, marginVertical: 2}}>
									{id} ({credit} cr)
								</Text>
								<Text style={{color: colors.fontB2, marginVertical: 2}}>{group}</Text>
							</View>
						</TouchableOpacity>
					</>
				)}
				keyExtractor={({id}) => id}
			/>
		</KeyboardAvoidingScreen>
	);
};
