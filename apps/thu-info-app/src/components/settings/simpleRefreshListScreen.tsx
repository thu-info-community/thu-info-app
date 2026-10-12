import {FC, PropsWithChildren, ReactElement, useEffect, useState} from "react";
import {Snackbar} from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes, {Theme} from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {RoundedListView} from "../views";
import {LibError} from "@thu-info/lib/src/utils/error";

export function roundedRefreshListScreen<T>(
	dataSource: (props: PropsWithChildren<any>) => Promise<T[]>,
	renderItem: (
		item: T,
		refresh: () => void,
		props: PropsWithChildren<any>,
		theme: Theme,
		index: number,
		total: number,
	) => ReactElement,
	keyExtractor: (item: T) => string,
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
				.catch((e) => {
					if (e instanceof LibError && e.message) {
						Snackbar.show({
							text: e.message,
							duration: Snackbar.LENGTH_SHORT,
						});
					} else {
						Snackbar.show({
							text: getStr("networkRetry") + e?.message,
							duration: Snackbar.LENGTH_SHORT,
						});
					}
				})
				.then(() => setRefreshing(false));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useEffect(refresh, []);

		return (
			<RoundedListView
				style={{margin: 16}}
				data={data}
				refreshing={refreshing}
				onRefresh={refresh}
				renderItem={(item, _, index) =>
					renderItem(item, refresh, props, theme, index, data.length)
				}
				keyExtractor={keyExtractor}
			/>
		);
	};
}
