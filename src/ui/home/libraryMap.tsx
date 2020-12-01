import {LibraryMapRouteProp} from "./homeStack";
import {Dimensions, Image, Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import {LIBRARY_MAP_URL} from "../../constants/strings";
import {LibrarySection} from "../../models/home/library";
import {getLibrarySectionList} from "../../network/library";
import {NetworkRetry} from "../../components/easySnackbars";

export const LibraryMapScreen = ({route}: {route: LibraryMapRouteProp}) => {
	const [sections, setSections] = useState<LibrarySection[]>([]);

	useEffect(() => {
		getLibrarySectionList(route.params.floor, route.params.dateChoice)
			.then(setSections)
			.catch(NetworkRetry);
	}, [route.params.dateChoice, route.params.floor]);

	const {width, height} = Dimensions.get("window");

	return (
		<View>
			<Image
				source={{uri: `${LIBRARY_MAP_URL}${route.params.floor.id}/floor.jpg`}}
				style={{width, height}}
				resizeMode="contain"
			/>
			{sections.map(({id, posX, posY, zhName}) => (
				<View
					key={id}
					style={{
						position: "absolute",
						left: (posX / 100) * width,
						top:
							(posY / 100) * width * (9 / 16) + (height - width * (9 / 16)) / 2,
						backgroundColor: "#cccc",
					}}>
					<Text style={{color: "black"}}>{zhName}</Text>
				</View>
			))}
		</View>
	);
};
