import React, {useEffect, useState} from "react";
import {split_text} from "../../utils/textSplitter";
import {
	Image,
	Linking,
	Pressable,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import {useColorScheme} from "react-native-appearance";
import themes from "../../assets/themes/themes";
import TimeAgo from "react-native-timeago";
import Icon from "react-native-vector-icons/FontAwesome";
import {getHoleDetail, holeConfig} from "../../network/hole";
import {Material} from "../../constants/styles";
import {HoleTitleCard} from "../../models/hole";
import {dummyHoleTitleCard} from "../../ui/home/holeDetail";
import {HomeNav} from "../../ui/home/homeStack";

export type NavigationHandler = (pid: number) => void;

const normalize_url = (url: string) =>
	/^https?:\/\//.test(url) ? url : "http://" + url;

const A = ({href, children}: {href: string | undefined; children: any}) => (
	<Text
		onPress={() => href && Linking.openURL(normalize_url(href))}
		style={{color: "blue"}}>
		{children}
	</Text>
);

const PidLink = ({
	pid,
	navigationHandler,
}: {
	pid: number;
	navigationHandler: NavigationHandler;
}) => (
	<Text onPress={() => navigationHandler(pid)} style={{color: "blue"}}>
		#{pid}
	</Text>
);

export const HoleMarkdown = ({
	text,
	navigationHandler,
}: {
	text: string;
	navigationHandler: NavigationHandler;
}) => {
	const themeName = useColorScheme();
	const theme = themes[themeName];
	return (
		<Markdown
			rules={{
				text: (node) => {
					const splitted = split_text(node.content);

					return (
						<React.Fragment key={node.key}>
							{splitted.map(([rule, p]: [string, string], idx: number) => {
								return (
									<Text key={idx} style={{color: theme.colors.text}}>
										{rule === "url_pid" ? (
											<Text>/##</Text>
										) : rule === "url" ? (
											<A href={p}>{p}</A>
										) : rule === "pid" ? (
											<PidLink
												pid={Number(p.substring(1))}
												navigationHandler={navigationHandler}
											/>
										) : rule === "nickname" ? (
											<Text>{p}</Text>
										) : (
											p
										)}
									</Text>
								);
							})}
						</React.Fragment>
					);
				},
				heading1: (node, children, parent, styles) => (
					<Text
						key={node.key}
						style={[
							styles.heading,
							styles.heading3,
							{color: theme.colors.text},
						]}>
						{children}
					</Text>
				),
				heading2: (node, children, parent, styles) => (
					<Text
						key={node.key}
						style={[
							styles.heading,
							styles.heading3,
							{color: theme.colors.text},
						]}>
						{children}
					</Text>
				),
				heading3: (node, children, parent, styles) => (
					<Text
						key={node.key}
						style={[
							styles.heading,
							styles.heading3,
							{color: theme.colors.text},
						]}>
						{children}
					</Text>
				),
				heading4: (node, children, parent, styles) => (
					<Text
						key={node.key}
						style={[
							styles.heading,
							styles.heading4,
							{color: theme.colors.text},
						]}>
						{children}
					</Text>
				),
				heading5: (node, children, parent, styles) => (
					<Text
						key={node.key}
						style={[
							styles.heading,
							styles.heading5,
							{color: theme.colors.text},
						]}>
						{children}
					</Text>
				),
				heading6: (node, children, parent, styles) => (
					<Text
						key={node.key}
						style={[
							styles.heading,
							styles.heading6,
							{color: theme.colors.text},
						]}>
						{children}
					</Text>
				),
			}}>
			{text}
		</Markdown>
	);
};

export const LazyQuote = ({
	pid,
	navigation,
}: {
	pid: number;
	navigation: HomeNav;
}) => {
	const [item, setData] = useState<HoleTitleCard>(dummyHoleTitleCard);
	const themeName = useColorScheme();
	const theme = themes[themeName];
	const MaterialTheme = Material(themeName);

	useEffect(() => {
		getHoleDetail(pid).then(([title]) => setData(title));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const needFold = holeConfig.foldTags.includes(item.tag);

	return (
		<TouchableOpacity
			style={[MaterialTheme.card, {marginLeft: 30}]}
			onPress={() => navigation.navigate("HoleDetail", {pid, lazy: true})}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View style={{flexDirection: "row", alignItems: "center"}}>
					<Text
						style={{
							fontWeight: "bold",
							marginVertical: 2,
							color: theme.colors.text,
						}}>{`#${pid}`}</Text>
					{item.tag !== null && item.tag !== undefined && item.tag !== "折叠" && (
						<View
							style={{
								backgroundColor: "#00c",
								borderRadius: 4,
								marginLeft: 5,
								paddingHorizontal: 4,
							}}>
							<Text style={{color: "white", fontWeight: "bold"}}>
								{item.tag}
							</Text>
						</View>
					)}
					<Text> </Text>
					<TimeAgo time={item.timestamp * 1000} />
				</View>
				<View style={{flexDirection: "row", alignItems: "center"}}>
					{needFold && <Text style={{color: theme.colors.text}}> 已隐藏</Text>}
					{!needFold && item.reply > 0 && (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
							}}>
							<Text style={{color: theme.colors.text}}>{item.reply}</Text>
							<Icon
								name="comment"
								size={12}
								style={{color: theme.colors.text}}
							/>
						</View>
					)}
					{!needFold && item.likenum > 0 && (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
							}}>
							<Text style={{color: theme.colors.text}}>{item.likenum}</Text>
							<Icon
								name="star-o"
								size={12}
								style={{color: theme.colors.text}}
							/>
						</View>
					)}
				</View>
			</View>
			{needFold || (
				<HoleMarkdown
					text={item.text}
					navigationHandler={(e) =>
						navigation.navigate("HoleDetail", {pid: e, lazy: true})
					}
				/>
			)}
			{!needFold && item.type === "image" && (
				<Pressable
					onPress={() =>
						navigation.navigate("HoleImage", {
							url: holeConfig.imageBase + item.url,
						})
					}>
					<Image
						source={{uri: holeConfig.imageBase + item.url}}
						style={{height: 400}}
						resizeMode="contain"
					/>
				</Pressable>
			)}
		</TouchableOpacity>
	);
};
