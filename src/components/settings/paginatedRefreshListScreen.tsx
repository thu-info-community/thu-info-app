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

export function paginatedRefreshListScreen<T, R>(
	dataSource: (props: PropsWithChildren<R>, page: number) => Promise<T[]>,
	renderItem: (
		item: T,
		refresh: () => void,
		props: PropsWithChildren<R>,
		theme: Theme,
		index: number,
		total: number,
	) => ReactElement,
	keyExtractor: (item: T) => string,
	footer?: (theme: Theme) => ReactElement,
	header?: (theme: Theme, refresh: () => void) => ReactElement,
	empty?: (theme: Theme) => ReactElement,
	initialNumToRender?: number,
): FC<R> {
	return (props: PropsWithChildren<R>) => {
		const [data, setData] = useState<T[]>([]);
		const [page, setPage] = useState<number>(1);
		const [refreshing, setRefreshing] = useState(false);
		const [locked, setLocked] = useState(false);

		const themeName = useColorScheme();
		const theme = themes(themeName);

		const refresh = (force: boolean) => {
			if ((locked || refreshing) && !force) {
				return;
			}
			setRefreshing(true);
			setLocked(false);
			dataSource(props, force ? 1 : page + 1)
				.then((r) => {
					setData((prevData) => (force ? r : prevData.concat(r)));
					if (r.length === 0) {
						setLocked(true);
					}
				})
				.catch((e) => {
					console.error(e);
					Snackbar.show({
						text: `${getStr("networkRetry")}: ${e.message}`,
						duration: Snackbar.LENGTH_SHORT,
					});
				})
				.then(() => {
					setRefreshing(false);
					setPage((prevPage) => (force ? 1 : prevPage + 1));
				});
		};
		useEffect(() => {
			refresh(true);
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		return (
			<FlatList
				style={{flex: 1, margin: 12}}
				data={data}
				contentContainerStyle={{
					backgroundColor: theme.colors.contentBackground,
					padding: 16,
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() => refresh(true)}
						colors={[theme.colors.accent]}
					/>
				}
				renderItem={({item, index}) =>
					renderItem(
						item,
						() => {
							refresh(true);
						},
						props,
						theme,
						index,
						data.length,
					)
				}
				keyExtractor={keyExtractor}
				ListHeaderComponent={
					header
						? header(theme, () => {
								refresh(true); // eslint-disable-next-line no-mixed-spaces-and-tabs
						  })
						: undefined
				}
				ListFooterComponent={footer ? footer(theme) : undefined}
				ListEmptyComponent={empty ? empty(theme) : undefined}
				initialNumToRender={initialNumToRender}
				onEndReached={() => refresh(false)}
			/>
		);
	};
}
