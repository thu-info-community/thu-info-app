import {NewsSlice} from "thu-info-lib/dist/models/news/news";
import {Theme} from "../../assets/themes/themes";
import {RootNav} from "../Root";
import {useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {IconStarButton} from "./IconStarButton";

export const NewsListItem = ({
	item,
	theme,
	navigation,
	isFromFav = false,
	reloadFunc = undefined,
}: {
	item: NewsSlice;
	theme: Theme;
	navigation: RootNav;
	isFromFav?: boolean;
	reloadFunc?: any;
}) => {
	const [inFav, setInFav] = useState(item.inFav);

	return (
		<TouchableOpacity
			style={{
				backgroundColor: theme.colors.contentBackground,
				justifyContent: "center",
				paddingVertical: 12,
				paddingHorizontal: 16,
				marginVertical: 4,
				borderRadius: 8,
			}}
			onPress={() =>
				navigation.navigate("NewsDetail", {
					detail: item,
					inFavInit: inFav,
					setInFavFunc: setInFav,
					isFromFav: isFromFav,
					reloadFunc: reloadFunc,
				})
			}>
			<Text
				numberOfLines={3}
				style={{
					fontSize: 16,
					fontWeight: "600",
					lineHeight: 20,
					color: theme.colors.fontB1,
				}}>
				{item.name.trim()}
			</Text>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginTop: 12,
				}}>
				<View
					style={{
						flexDirection: "row",
						flex: item.topped ? 18 : 21,
						marginRight: 2,
						alignItems: "center",
					}}>
					{item.source.length > 0 && (
						<>
							<Text
								style={{
									fontWeight: "600",
									color: theme.colors.fontB2,
									fontSize: 12,
								}}>
								{item.source}
							</Text>
							<View
								style={{
									marginHorizontal: 6,
									height: 12,
									width: 3,
									borderRadius: 1.5,
									backgroundColor: theme.colors.accent,
								}}
							/>
						</>
					)}
					<Text
						numberOfLines={1}
						style={{
							flex: 1,
							fontWeight: "600",
							color: theme.colors.fontB2,
							fontSize: 12,
						}}>
						{getStr(item.channel)}
					</Text>
				</View>
				{item.topped && (
					<View
						style={{
							borderColor: theme.colors.statusWarning,
							backgroundColor: theme.colors.statusWarningOpacity,
							borderWidth: 1,
							borderRadius: 20,
							paddingHorizontal: 6,
							marginHorizontal: 2,
							flex: 3,
							alignItems: "center",
						}}>
						<Text style={{color: theme.colors.statusWarning, fontSize: 11}}>
							{getStr("topped")}
						</Text>
					</View>
				)}
				<View
					style={{
						flexDirection: "row",
						flex: 8,
						marginLeft: 2,
						alignItems: "center",
					}}>
					<Text
						numberOfLines={1}
						style={{color: theme.colors.fontB2, marginRight: -6}}>
						{item.date.slice(0, 10)}
					</Text>
					<IconStarButton
						active={inFav}
						onPress={() => {
							if (inFav) {
								helper
									.removeNewsFromFavor(item)
									.then((res) => {
										if (res) {
											setInFav(!inFav);
											reloadFunc?.();
										} else {
											return;
										}
									})
									.catch(() => {
										Snackbar.show({
											text: getStr("networkRetry"),
											duration: Snackbar.LENGTH_LONG,
										});
									});
							} else {
								// not in fav
								helper
									.addNewsToFavor(item)
									.then((res) => {
										if (res) {
											setInFav(!inFav);
										} else {
											return;
										}
									})
									.catch(() => {
										Snackbar.show({
											text: getStr("networkRetry"),
											duration: Snackbar.LENGTH_LONG,
										});
									});
							}
						}}
					/>
				</View>
			</View>
		</TouchableOpacity>
	);
};
