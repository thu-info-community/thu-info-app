import React, {useEffect, useState} from "react";
import {FlatList, Text, View} from "react-native";
import {getHoleList, holeLogin} from "../../network/hole";
import {FetchMode, HoleTitleCard} from "../../models/home/hole";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {NetworkRetry} from "../../components/easySnackbars";

export const HoleScreen = () => {
	const [data, setData] = useState<HoleTitleCard[]>([]);
	const [page, setPage] = useState(1);
	useEffect(() => {
		setPage(1);
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
			});
	}, []);
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
			onEndReached={() => {
				getHoleList(FetchMode.NORMAL, page + 1, "").then((r) =>
					setData((o) =>
						o.concat(r.filter((it) => it.pid < o[o.length - 1].pid)),
					),
				);
				setPage((p) => p + 1);
			}}
		/>
	);
};
