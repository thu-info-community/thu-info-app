import {
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {Classroom} from "thu-info-lib/dist/models/home/classroom";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";

export const ClassroomListScreen = ({navigation}: {navigation: RootNav}) => {
	const [classrooms, setClassrooms] = useState<Classroom[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getClassroomList()
			.then(setClassrooms)
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};

	useEffect(() => {
		refresh();
	}, []);

	return (
		<ScrollView
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}>
			<View
				style={{
					flexWrap: "wrap",
					flexDirection: "row",
					justifyContent: "center",
				}}>
				{classrooms.map((classroom) => (
					<TouchableOpacity
						key={classroom.name}
						style={{
							backgroundColor: colors.themeBackground,
							padding: 7,
							marginHorizontal: 5,
							marginTop: 10,
							width: 120,
							height: 40,
							justifyContent: "center",
							borderRadius: 3,
							shadowColor: "grey",
							shadowOffset: {
								width: 2,
								height: 2,
							},
							shadowOpacity: 0.8,
							shadowRadius: 2,
							borderColor: "#aaa",
							borderWidth: 2,
						}}
						onPress={() => navigation.navigate("ClassroomDetail", classroom)}>
						<Text style={{textAlign: "center", color: colors.text}}>
							{classroom.name}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</ScrollView>
	);
};
