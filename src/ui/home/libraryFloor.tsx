import {FlatList, Text, TouchableOpacity} from "react-native";
import React, {useEffect, useState} from "react";
import {HomeNav, LibraryFloorRouteProp} from "./homeStack";
import {LibraryFloor} from "../../models/home/library";
import {getLibraryFloorList} from "../../network/library";

export const LibraryFloorScreen = ({
	route,
	navigation,
}: {
	route: LibraryFloorRouteProp;
	navigation: HomeNav;
}) => {
	const [libraryFloors, setLibraryFloors] = useState<LibraryFloor[]>([]);
	useEffect(() => {
		getLibraryFloorList(route.params.id).then(setLibraryFloors);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return (
		<FlatList
			data={libraryFloors}
			renderItem={({item}) => (
				<TouchableOpacity style={{padding: 8}} disabled={!item.valid}>
					<Text>{item.zhName}</Text>
				</TouchableOpacity>
			)}
			keyExtractor={(item) => String(item.id)}
		/>
	);
};
