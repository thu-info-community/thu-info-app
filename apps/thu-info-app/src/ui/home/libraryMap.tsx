import {
	LibraryMapRouteProp,
	LibrarySeatMapRouteProp,
} from "../../components/Root";
import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import {ResponsiveImageViewer} from "../../components/ResponsiveImageViewer";
import {saveImg} from "../../utils/saveImg";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {useFontScale} from "../../utils/useFontScale";
import {LibrarySection} from "@thu-info/lib/src/models/home/library";

const LIBRARY_IMAGE_BASE =
	"https://seat.lib.tsinghua.edu.cn/Public/home/images/web/area/";

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
	const {isLargeText} = useFontScale();
	const {colors} = themes(useColorScheme());
	const imageWidth = Math.min(bounds.width, bounds.height * aspectRatio);
	return (
		<View style={{flex: 1}}>
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
					{/* The labels are pinned to fixed image coordinates, so at a large
					    system font they would grow in place and overlap each other and
					    the map. Fall back to a plain list below the image (see below)
					    instead of capping the glyphs. */}
					{!isLargeText &&
						sections.map(({id, posX, posY, zhName}) => (
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
			{isLargeText && (
				<ScrollView
					testID="library-map-legend"
					style={{flexGrow: 0, maxHeight: "45%"}}
					contentContainerStyle={{padding: 16}}>
					{sections.map(({id, zhName}) => (
						<Text
							key={id}
							style={{color: colors.text, fontSize: 16, paddingVertical: 4}}>
							{zhName}
						</Text>
					))}
				</ScrollView>
			)}
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
