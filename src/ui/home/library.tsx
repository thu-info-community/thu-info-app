import {
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {RootNav} from "../../components/Root";
import React, {useEffect, useState} from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import {helper} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {NetworkRetry} from "../../components/easySnackbars";
import {Library} from "thu-info-lib/dist/models/home/library";

export const LibraryScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [refreshing, setRefreshing] = useState(false);
	const [libraryList, setLibraryList] = useState<Library[]>([]);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getLibraryList()
			.then(setLibraryList)
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};

	useEffect(() => {
		refresh();
	}, []);

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
			{libraryList.length > 0 && (
				<RoundedView style={{margin: 16}}>
					{libraryList.map((library, index) => (
						<>
							{index > 0 && (
								<View
									style={{
										height: 0.5,
										marginHorizontal: 16,
										backgroundColor: colors.fontB3,
									}}
								/>
							)}
							<TouchableOpacity
								disabled={!library.valid}
								onPress={() =>
									library.valid &&
									navigation.navigate("LibraryFloor", {library, dateChoice: 0})
								}
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									marginHorizontal: 16,
									marginTop: index === 0 ? 0 : 12,
									marginBottom: index === libraryList.length - 1 ? 0 : 12,
								}}>
								<Text
									style={{
										fontSize: 16,
										color: library.valid ? colors.text : colors.fontB2,
									}}>
									{library.zhName}
								</Text>
								<Icon name="angle-right" size={16} color={colors.fontB2} />
							</TouchableOpacity>
						</>
					))}
				</RoundedView>
			)}
		</ScrollView>
	);
};
