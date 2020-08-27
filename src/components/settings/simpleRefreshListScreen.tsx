import React, {useEffect, useState} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {FlatList, RefreshControl} from "react-native";

export function simpleRefreshListScreen<T>(
	dataSource: () => Promise<T[]>,
	renderItem: (item: T) => JSX.Element,
	keyExtractor: (item: T) => string,
	footer?: JSX.Element,
): any {
	return () => {
		const [data, setData] = useState<T[]>([]);
		const [refreshing, setRefreshing] = useState(false);

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
				refreshing={refreshing}
				refreshControl={<RefreshControl refreshing={refreshing} />}
				onRefresh={refresh}
				renderItem={({item}) => renderItem(item)}
				keyExtractor={keyExtractor}
				ListFooterComponent={footer}
			/>
		);
	};
}
