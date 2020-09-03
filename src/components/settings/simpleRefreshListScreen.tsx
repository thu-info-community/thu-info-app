import React, {FC, ReactElement, useContext, useEffect, useState} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {FlatList, RefreshControl} from "react-native";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";

export function simpleRefreshListScreen<T>(
	dataSource: () => Promise<T[]>,
	renderItem: (item: T, refresh: () => void) => ReactElement,
	keyExtractor: (item: T) => string,
	footer?: ReactElement,
): FC {
	return () => {
		const [data, setData] = useState<T[]>([]);
		const [refreshing, setRefreshing] = useState(false);

		const themeName = useContext(ThemeContext);
		const theme = themes[themeName];

		const refresh = () => {
			setRefreshing(true);
			dataSource()
				.then(setData)
				.catch(() =>
					Snackbar.show({
						text: getStr("networkRetry"),
						duration: Snackbar.LENGTH_SHORT,
					}),
				)
				.then(() => setRefreshing(false));
		};
		useEffect(refresh, []);

		return (
			<FlatList
				data={data}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				renderItem={({item}) => renderItem(item, refresh)}
				keyExtractor={keyExtractor}
				ListFooterComponent={footer}
			/>
		);
	};
}
