import {LibraryMapRouteProp, LibrarySeatMapRouteProp} from "./homeStack";
import {Dimensions, Image, Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import {LIBRARY_MAP_URL} from "../../constants/strings";
import {LibrarySection} from "../../helper/src/models/home/library";
import {NetworkRetry} from "../../components/easySnackbars";
import ImageViewer from "react-native-image-zoom-viewer";
import {saveImg} from "../../utils/saveImg";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";

export const LibraryMapScreen = ({route}: {route: LibraryMapRouteProp}) => {
	const [sections, setSections] = useState<LibrarySection[]>([]);

	useEffect(() => {
		helper
			.getLibrarySectionList(route.params.floor, route.params.dateChoice)
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

export const LibrarySeatMapScreen = ({
	route,
}: {
	route: LibrarySeatMapRouteProp;
}) => {
	return (
		<View style={{flex: 1}}>
			{
				<ImageViewer
					imageUrls={[
						{url: `${LIBRARY_MAP_URL}${route.params.section.id}/seat-free.jpg`},
					]}
					onSave={saveImg}
					menuContext={{
						saveToLocal: getStr("holeSaveImage"),
						cancel: getStr("cancel"),
					}}
				/>
			}
		</View>
	);
};
