import {
	LibraryMapRouteProp,
	LibrarySeatMapRouteProp,
} from "../../components/Root";
import {Image, StyleSheet, Text, View} from "react-native";
import {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import {ResponsiveImageViewer} from "../../components/ResponsiveImageViewer";
import {saveImg} from "../../utils/saveImg";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import {LibrarySection} from "@thu-info/lib/src/models/home/library";

const LIBRARY_IMAGE_BASE = "https://seat.lib.tsinghua.edu.cn/Public/home/images/web/area/";

export const LibraryMapScreen = ({route}: {route: LibraryMapRouteProp}) => {
	const [sections, setSections] = useState<LibrarySection[]>([]);

	useEffect(() => {
		helper
			.getLibrarySectionList(route.params.floor, route.params.dateChoice)
			.then(setSections)
			.catch(NetworkRetry);
	}, [route.params.dateChoice, route.params.floor]);

	return (
		<LibraryFloorMap
			uri={`${LIBRARY_IMAGE_BASE}${route.params.floor.id}/floor.jpg`}
			sections={sections}
		/>
	);
};

/** Image coordinates belong to the fitted image, rather than the window. */
export const LibraryFloorMap = ({
	uri,
	sections,
}: {
	uri: string;
	sections: LibrarySection[];
}) => {
	const [bounds, setBounds] = useState({width: 0, height: 0});
	const [aspectRatio, setAspectRatio] = useState(16 / 9);
	const imageWidth = Math.min(bounds.width, bounds.height * aspectRatio);
	return (
		<View
			testID="library-map-container"
			style={{flex: 1, alignItems: "center", justifyContent: "center"}}
			onLayout={({nativeEvent}) => setBounds(nativeEvent.layout)}>
			<View
				testID="library-map-image-frame"
				style={{width: imageWidth, aspectRatio}}>
				<Image
					testID="library-map-image"
					source={{uri}}
					style={StyleSheet.absoluteFill}
					resizeMode="contain"
					onLoad={({nativeEvent: {source}}) => {
						if (source.width > 0 && source.height > 0)
							setAspectRatio(source.width / source.height);
					}}
				/>
				{sections.map(({id, posX, posY, zhName}) => (
					<View
						key={id}
						style={{
							position: "absolute",
							left: `${posX}%`,
							top: `${posY}%`,
							backgroundColor: "#cccc",
						}}>
						<Text style={{color: "black"}}>{zhName}</Text>
					</View>
				))}
			</View>
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
				<ResponsiveImageViewer
					imageUrls={[
						{
							url: `${LIBRARY_IMAGE_BASE}${route.params.section.id}/seat-free.jpg`,
						},
					]}
					onSave={saveImg}
					renderIndicator={() => <View />}
					menuContext={{
						saveToLocal: getStr("saveImage"),
						cancel: getStr("cancel"),
					}}
				/>
			}
		</View>
	);
};
