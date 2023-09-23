import {Image, ImageProps, View} from "react-native";
import {useEffect, useState} from "react";

export const LazyImage = (
	props: ImageProps & {
		appearance: boolean;
		source: {uri: string};
		style: {height: number; width: number};
	},
) => {
	const {
		appearance,
		style: {height, width},
	} = props;

	const [lazyAppearance, setLazyAppearance] = useState(false);

	useEffect(() => {
		if (appearance) {
			setLazyAppearance(true);
		}
	}, [appearance]);

	return lazyAppearance ? (
		<Image {...props} />
	) : (
		<View style={{height, width}} />
	);
};
