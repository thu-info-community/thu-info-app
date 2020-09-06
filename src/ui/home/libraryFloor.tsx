import {Text, TouchableOpacity} from "react-native";
import React from "react";
import {HomeNav, LibraryFloorRouteProp} from "./homeStack";
import {getLibraryFloorList} from "../../network/library";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const LibraryFloorScreen = simpleRefreshListScreen(
	({route}: {route: LibraryFloorRouteProp}) =>
		getLibraryFloorList(route.params),
	(item, _, {navigation}: {navigation: HomeNav}) => (
		<TouchableOpacity
			style={{padding: 8}}
			onPress={() => item.valid && navigation.navigate("LibrarySection", item)}
			disabled={!item.valid}>
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
