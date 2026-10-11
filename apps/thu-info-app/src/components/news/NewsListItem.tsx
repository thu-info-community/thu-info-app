import {NewsSlice} from "@thu-info/lib/src/models/news/news";
import {Theme} from "../../assets/themes/themes";
import {RootNav, RootStackParamList} from "../Root";
import {useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import {getStr, hasStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import {Snackbar} from "react-native-snackbar";
import {IconStarButton} from "./IconStarButton";
import {useFontScale} from "../../utils/useFontScale";
import md5 from "md5";

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
	const {isLargeText} = useFontScale();
	const colorList: string[] = theme.colors.courseItemColorList;
	const channelColor =
		colorList[parseInt(md5(item.channel).slice(0, 6), 16) % colorList.length];
	// Channels come from the news API, so a new one can appear before it has a
	// translation. `getStr` would render the raw id (`LM_BM_207_TZGG`) — hide the
	// badge instead, and keep the source line with it (see below).
	const showChannel = hasStr(item.channel);

	const handlePress = () => {
		const params: RootStackParamList["NewsDetail"] = {
			detail: item,
			inFavInit: inFav,
			setInFavFunc: setInFav,
			isFromFav,
			reloadFunc,
		};
		navigation.navigate("NewsDetail", params);
	};

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
			onPress={handlePress}>
			{/* No literal lineHeight: at a large system font the glyphs scale but a
			    fixed 20pt line box would not, smearing the lines together. Letting
			    React Native derive it keeps the lines separated at any scale. */}
			<Text
				numberOfLines={3}
				style={{
					fontSize: 16,
					fontWeight: "600",
					color: theme.colors.fontB1,
				}}>
				{item.name.trim()}
			</Text>
			{/* At a large system font the source + channel can no longer share a line
			    with the date and favourite star (the date alone is ~148dp at 2.0x), so
			    the row is allowed to wrap and the labels keep the full card width —
			    otherwise 「国家大学生文化素质教育基地」 is squeezed to 3 glyphs a line
			    (or ellipsized). At font scale 1 the row is a plain nowrap row, exactly
			    as before. */}
			<View
				style={{
					flexDirection: "row",
					flexWrap: isLargeText ? "wrap" : "nowrap",
					alignItems: "center",
					marginTop: 12,
					gap: 8,
				}}>
				<View
					style={{
						flexDirection: "row",
						...(isLargeText
							? {flexGrow: 1, flexShrink: 0, flexBasis: "auto"}
							: {flex: 1}),
						minWidth: 0,
						alignItems: "center",
					}}>
					{item.source.length > 0 && (
						<>
							{/* No `numberOfLines`: the source is a short, bounded name (a
							    publisher/department), so at a large system font it should
							    wrap onto a third line rather than ellipsize — 「国家大学生
							    文化素质教育基地」 was rendering as 「国家大 / 学生文…」. */}
							<Text
								style={{
									flexShrink: 1,
									fontWeight: "600",
									color: theme.colors.fontB2,
									fontSize: 12,
								}}>
								{item.source}
							</Text>
							{showChannel && (
								<View
									style={{
										marginHorizontal: 6,
										height: 12,
										width: 3,
										borderRadius: 1.5,
										backgroundColor: channelColor,
									}}
								/>
							)}
						</>
					)}
					{showChannel && (
						// No `numberOfLines`: the channel is a label, so at a large
						// system font it wraps instead of being ellipsized away.
						<Text
							style={{
								flexShrink: 1,
								fontWeight: "600",
								color: theme.colors.fontB2,
								fontSize: 12,
							}}>
							{getStr(item.channel)}
						</Text>
					)}
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
							flexShrink: 0,
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
						flexShrink: 0,
						alignItems: "center",
					}}>
					<Text style={{color: theme.colors.fontB2, fontSize: 12}}>
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
