import React, {useEffect, useState} from "react";
import {FlatList, Text, View} from "react-native";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {HOLE_SET_TOKEN} from "../../redux/constants";
import {getHoleList} from "../../network/hole";
import {FetchMode, HoleTitleCard} from "../../models/home/hole";
import Snackbar from "react-native-snackbar";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface HoleProps {
	token: string;
	setToken: (token: string) => void;
}

const HoleUI = () => {
	const [data, setData] = useState<HoleTitleCard[]>([]);
	const [page, setPage] = useState(1);
	useEffect(() => {
		setPage(1);
		getHoleList(FetchMode.NORMAL, 1, "")
			.then((r) => setData(r))
			.catch((err) => {
				if (typeof err === "string") {
					Snackbar.show({text: err, duration: Snackbar.LENGTH_SHORT});
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

export const HoleScreen = connect(
	(state: State) => state.hole,
	(dispatch) => {
		return {
			setToken: (token: string) =>
				dispatch({type: HOLE_SET_TOKEN, payload: token}),
		};
	},
)(HoleUI);
