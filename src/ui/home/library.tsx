import {Text, TouchableOpacity} from "react-native";
import {getLibraryList} from "../../network/library";
import {HomeNav} from "./homeStack";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import React from "react";

export const LibraryScreen = simpleRefreshListScreen(
	getLibraryList,
	(item, _, {navigation}: {navigation: HomeNav}) => (
		<TouchableOpacity
			style={{padding: 8}}
			disabled={!item.valid}
			onPress={() => item.valid && navigation.navigate("LibraryFloor", item)}>
			<Text
				style={{
					textAlign: "center",
					textDecorationLine: item.valid ? "none" : "line-through",
					color: item.valid ? "black" : "grey",
				}}>
				{item.zhName}
			</Text>
		</TouchableOpacity>
	),
	(item) => String(item.id),
);
