import {useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {LazyImage} from "../../components/LazyImage";

const mapUrl = (scale: number, row: number, col: number) =>
	`https://ditu.pt.tsinghua.edu.cn/api/geoserver/gwc/service/wmts?layer=tsinghua:qhMap&style=&tilematrixset=3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=3857:${scale}&TileCol=${col}&TileRow=${row}`;

export const CampusMapScreen = () => {
	const themeName = useColorScheme();
	const {} = themes(themeName);

	const isPressed = useSharedValue(false);
	const offset = useSharedValue({x: 0, y: 0});
	const start = useSharedValue({x: 0, y: 0});
	const panGesture = Gesture.Pan()
		.onBegin(() => {
			isPressed.value = true;
		})
		.onUpdate((e) => {
			offset.value = {
				x: e.translationX + start.value.x,
				y: e.translationY + start.value.y,
			};
		})
		.onEnd(() => {
			start.value = {
				x: offset.value.x,
				y: offset.value.y,
			};
		})
		.onFinalize(() => {
			isPressed.value = false;
		});

	const scale = useSharedValue(1);
	const savedScale = useSharedValue(1);

	const pinchGesture = Gesture.Pinch()
		.onUpdate((e) => {
			scale.value = savedScale.value * e.scale;
		})
		.onEnd(() => {
			savedScale.value = scale.value;
		});

	const transformGesture = Gesture.Simultaneous(panGesture, pinchGesture);

	const doubleTap = Gesture.Tap()
		.numberOfTaps(2)
		.onStart(() => {
			scale.value = savedScale.value * 2;
			savedScale.value = scale.value;
		});

	const tapGesture = Gesture.Exclusive(doubleTap);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{translateX: offset.value.x},
				{translateY: offset.value.y},
				{scale: scale.value},
			],
		};
	});

	const rowBase = 24807;
	const colBase = 53941;

	return (
		<View style={{flex: 1}}>
			<GestureDetector
				gesture={Gesture.Exclusive(transformGesture, tapGesture)}>
				<Animated.View style={animatedStyle}>
					{[0, 1, 2, 3, 4, 5].map((row) => (
						<View style={{flexDirection: "row"}} key={row}>
							{[0, 1, 2, 3, 4].map((col) => (
								<LazyImage
									appearance={true}
									source={{
										uri: mapUrl(16, rowBase + row, colBase + col),
									}}
									style={{height: 128, width: 128}}
									key={col}
								/>
							))}
						</View>
					))}
				</Animated.View>
			</GestureDetector>
		</View>
	);
};
