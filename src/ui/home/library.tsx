import {FlatList, Text, TouchableOpacity} from "react-native";
import React, {useEffect, useState} from "react";
import {getLibraryList} from "../../network/library";
import {Library} from "../../models/home/library";
import {HomeNav} from "./homeStack";

export const LibraryScreen = ({navigation}: {navigation: HomeNav}) => {
	const [libraries, setLibraries] = useState<Library[]>([]);
	useEffect(() => {
		getLibraryList().then(setLibraries);
	}, []);
	return (
		<FlatList
			data={libraries}
			renderItem={({item}) => (
				<TouchableOpacity
					style={{padding: 8}}
					disabled={!item.valid}
					onPress={() =>
						item.valid && navigation.navigate("LibraryFloor", item)
					}>
					<Text>{item.zhName}</Text>
				</TouchableOpacity>
			)}
			keyExtractor={(item) => String(item.id)}
		/>
	);
};
