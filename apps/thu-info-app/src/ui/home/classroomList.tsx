import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import {
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {Classroom} from "@thu-info/lib/src/models/home/classroom";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {radius, spacing} from "../../components/subpage/tokens";

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
				<ThemedRefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
				/>
			}
			style={{
				paddingHorizontal: spacing.sm,
				marginBottom: spacing.lg,
			}}>
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
							backgroundColor: colors.contentBackground,
							padding: 5,
							marginHorizontal: spacing.sm,
							marginTop: spacing.md,
							width: 100,
							height: 50,
							justifyContent: "center",
							borderRadius: radius.hub,
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
