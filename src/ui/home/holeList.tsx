import React, {useContext, useEffect, useState} from "react";
import {FlatList, RefreshControl, Text, View} from "react-native";
import {getHoleList, holeLogin} from "../../network/hole";
import {FetchMode, HoleTitleCard} from "../../models/home/hole";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {NetworkRetry} from "../../components/easySnackbars";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";

export const HoleListScreen = () => {
	const [data, setData] = useState<HoleTitleCard[]>([]);
	const [refreshing, setRefreshing] = useState(true);
	const [page, setPage] = useState(1);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

	const firstFetch = () => {
		setPage(1);
		setRefreshing(true);
		getHoleList(FetchMode.NORMAL, 1, "")
			.then((r) => setData(r))
			.catch((err) => {
				if (typeof err === "string") {
					holeLogin()
						.then(() =>
							Snackbar.show({text: err, duration: Snackbar.LENGTH_SHORT}),
						)
						.catch(() =>
							Snackbar.show({
								text: getStr("holePleaseSetToken"),
								duration: Snackbar.LENGTH_LONG,
							}),
						);
				} else {
					NetworkRetry();
				}
			})
			.then(() => setRefreshing(false));
	};

	useEffect(firstFetch, []);

	return (
		<FlatList
			data={data}
			renderItem={({item}) => (
				<View style={{padding: 10}}>
					<Text>{item.text}</Text>
				</View>
			)}
			keyExtractor={(item) => `${item.pid}`}
			onEndReachedThreshold={0.5}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={firstFetch}
					colors={[theme.colors.accent]}
				/>
			}
			onEndReached={() => {
				setRefreshing(true);
				getHoleList(FetchMode.NORMAL, page + 1, "")
					.then((r) =>
						setData((o) =>
							o.concat(r.filter((it) => it.pid < o[o.length - 1].pid)),
						),
					)
					.catch(NetworkRetry)
					.then(() => setRefreshing(false));
				setPage((p) => p + 1);
			}}
		/>
	);
};
