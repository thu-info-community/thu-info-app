import React, {
	FC,
	PropsWithChildren,
	ReactElement,
	useEffect,
	useState,
} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {FlatList, RefreshControl} from "react-native";
import themes, {Theme} from "../../assets/themes/themes";
import {useColorScheme} from "react-native";

export function simpleRefreshListScreen<T>(
	dataSource: (props: PropsWithChildren<any>) => Promise<T[]>,
	renderItem: (
		item: T,
		refresh: () => void,
		props: PropsWithChildren<any>,
		theme: Theme,
	) => ReactElement,
	keyExtractor: (item: T) => string,
	footer?: (theme: Theme) => ReactElement,
	header?: (theme: Theme) => ReactElement,
	empty?: (theme: Theme) => ReactElement,
	initialNumToRender?: number,
): FC {
	return (props) => {
		const [data, setData] = useState<T[]>([]);
		const [refreshing, setRefreshing] = useState(false);

		const themeName = useColorScheme();
		const theme = themes(themeName);

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
				renderItem={({item}) => renderItem(item, refresh, props, theme)}
				keyExtractor={keyExtractor}
				ListHeaderComponent={
					data.length === 0 ? null : header ? header(theme) : undefined
				}
				ListFooterComponent={footer ? footer(theme) : undefined}
				ListEmptyComponent={empty ? empty(theme) : undefined}
				initialNumToRender={initialNumToRender}
			/>
		);
	};
}
