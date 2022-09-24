import {Image, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

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

	return (
		<View style={{flex: 1}}>
			<GestureDetector
				gesture={Gesture.Exclusive(transformGesture, tapGesture)}>
				<Animated.View style={animatedStyle}>
					{[24807, 24808, 24809, 24810, 24811, 24812, 24813].map((row) => (
						<View style={{flexDirection: "row"}} key={row}>
							{[53941, 53942, 53943, 53944, 53945].map((col) => (
								<Image
									source={{
										uri: mapUrl(16, row, col),
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
