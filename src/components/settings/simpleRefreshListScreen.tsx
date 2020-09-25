import React, {
	FC,
	PropsWithChildren,
	ReactElement,
	useContext,
	useEffect,
	useState,
} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {FlatList, RefreshControl} from "react-native";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";

export function simpleRefreshListScreen<T>(
	dataSource: (props: PropsWithChildren<any>) => Promise<T[]>,
	renderItem: (
		item: T,
		refresh: () => void,
		props: PropsWithChildren<any>,
	) => ReactElement,
	keyExtractor: (item: T) => string,
	footer?: ReactElement,
	header?: ReactElement,
	empty?: ReactElement,
): FC {
	return (props) => {
		const [data, setData] = useState<T[]>([]);
		const [refreshing, setRefreshing] = useState(false);

		const themeName = useContext(ThemeContext);
		const theme = themes[themeName];

		const refresh = () => {
			setRefreshing(true);
			dataSource(props)
				.then(setData)
				.catch(() =>
					Snackbar.show({
						text: getStr("networkRetry"),
						duration: Snackbar.LENGTH_SHORT,
					}),
				)
				.then(() => setRefreshing(false));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useEffect(refresh, []);

		return (
			<FlatList
				style={{flex: 1}}
				data={data}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				renderItem={({item}) => renderItem(item, refresh, props)}
				keyExtractor={keyExtractor}
				ListHeaderComponent={refreshing ? null : header}
				ListFooterComponent={footer}
				ListEmptyComponent={empty}
			/>
		);
	};
}
