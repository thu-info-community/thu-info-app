import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import {
	FlatList,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import {helper} from "../../redux/store";
import {RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {CrSemester} from "@thu-info/lib/src/models/cr/cr";
import {Separator} from "../../components/subpage/rows";
import {roundedListContent, spacing} from "../../components/subpage/tokens";

export const CrHomeScreen = ({navigation}: {navigation: RootNav}) => {
	const [semesters, setSemesters] = useState<CrSemester[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getCrAvailableSemesters()
			.then(setSemesters)
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};
	useEffect(refresh, []);

	return (
		<FlatList
			style={{flex: 1, margin: spacing.md}}
			data={semesters}
			contentContainerStyle={roundedListContent(colors, semesters.length > 0)}
			refreshControl={
				<ThemedRefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
				/>
			}
			renderItem={({item: {id, name}, index}) => (
				<>
					{index > 0 && <Separator style={{marginHorizontal: 0}} />}
					<TouchableOpacity
						onPress={() =>
							navigation.navigate("CrCoursePlan", {semesterId: id})
						}
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
						}}>
						<View style={{flex: 2, alignItems: "flex-start"}}>
							<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
								{name}
							</Text>
							<Text style={{color: colors.fontB2, marginVertical: 2}}>
								{id}
							</Text>
						</View>
					</TouchableOpacity>
				</>
			)}
			keyExtractor={({id}) => id}
		/>
	);
};
