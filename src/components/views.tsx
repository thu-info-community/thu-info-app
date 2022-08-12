import React from "react";
import {
	RefreshControl,
	ScrollView,
	useColorScheme,
	View,
	ViewProps,
} from "react-native";
import themes, {ColorTheme} from "../assets/themes/themes";

export const RoundedView = (props: ViewProps) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return React.createElement(View, {
		...props,
		style: [
			{
				backgroundColor: colors.contentBackground,
				borderRadius: 12,
				paddingVertical: 16,
			},
			props.style,
		],
	});
};

interface ListProps<T> {
	data: T[];
	renderItem: (
		item: T,
		colors: ColorTheme,
		index: number,
	) => React.ReactElement;
	keyExtractor?: (item: T, index: number) => string;
	refreshing?: boolean;
	onRefresh?: () => void;
}

export function RoundedListView<T>(props: ViewProps & ListProps<T>) {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const viewProps = {
		...props,
		data: undefined,
		renderItem: undefined,
		keyExtractor: undefined,
		refreshing: undefined,
		onRefresh: undefined,
	};
	return (
		<ScrollView
			refreshControl={
				props.refreshing !== undefined && props.onRefresh !== undefined ? (
					<RefreshControl
						refreshing={props.refreshing}
						onRefresh={props.onRefresh}
						colors={[colors.accent]}
					/>
				) : undefined
			}
			{...viewProps}>
			{props.data.length > 0 && (
				<RoundedView style={{padding: 16}}>
					{props.data.map((item, index) => (
						<View key={props.keyExtractor?.(item, index)}>
							{index > 0 && (
								<View style={{height: 0.5, backgroundColor: colors.fontB3}} />
							)}
							{props.renderItem(item, colors, index)}
						</View>
					))}
				</RoundedView>
			)}
		</ScrollView>
	);
}
