import {ComponentProps, useState} from "react";
import {Image, StyleSheet, View} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";

// The viewer only updates its crop bounds when width changes. Remount when
// either measured dimension changes, including keyboard and split-window resize.
export const ResponsiveImageViewer = (
	props: ComponentProps<typeof ImageViewer>,
) => {
	const [bounds, setBounds] = useState({width: 0, height: 0});
	const [imageSizes, setImageSizes] = useState<
		Record<string, {width: number; height: number}>
	>({});
	// Android's encoded-image size request rejects data URIs. Let the native
	// image view decode them, then give the legacy viewer the intrinsic size.
	const pendingImages = props.imageUrls.filter(
		(image) =>
			image.url.startsWith("data:") &&
			!(image.width && image.height) &&
			!imageSizes[image.url],
	);
	const imageUrls = props.imageUrls.map((image) => ({
		...image,
		...imageSizes[image.url],
	}));
	return (
		<View
			testID="responsive-image-viewer"
			style={{flex: 1}}
			onLayout={({nativeEvent: {layout}}) => {
				setBounds((current) =>
					current.width === layout.width && current.height === layout.height
						? current
						: {width: layout.width, height: layout.height},
				);
			}}>
			{pendingImages.map((image) => (
				<Image
					key={image.url}
					testID="encoded-image-loader"
					source={{uri: image.url}}
					style={[StyleSheet.absoluteFill, {opacity: 0}]}
					accessible={false}
					onLoad={({nativeEvent: {source}}) => {
						if (source.width > 0 && source.height > 0)
							setImageSizes((current) => ({
								...current,
								[image.url]: {width: source.width, height: source.height},
							}));
					}}
				/>
			))}
			{bounds.width > 0 && bounds.height > 0 && pendingImages.length === 0 && (
				<ImageViewer
					key={`${bounds.width}:${bounds.height}`}
					{...props}
					imageUrls={imageUrls}
				/>
			)}
		</View>
	);
};
