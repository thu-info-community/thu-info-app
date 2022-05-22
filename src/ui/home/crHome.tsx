import {
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React, {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {CrTimeoutError} from "thu-info-lib/dist/utils/error";
import {CrSemester} from "thu-info-lib/dist/models/cr/cr";

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
			data={semesters}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}
			renderItem={({item: {id, name}}) => (
				<TouchableOpacity
					onPress={() => navigation.navigate("CrCoursePlan", {semesterId: id})}
					style={{
						padding: 15,
						flexDirection: "row",
						justifyContent: "space-between",
					}}>
					<View style={{flex: 2, alignItems: "flex-start"}}>
						<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
							{name}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>{id}</Text>
					</View>
				</TouchableOpacity>
			)}
			keyExtractor={({id}) => id}
		/>
	);
};
