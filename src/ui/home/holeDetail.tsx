import {Image, ScrollView, StyleSheet, Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import {HoleDetailRouteProp} from "./homeStack";
import {getStr} from "../../utils/i18n";
import {Material} from "../../constants/styles";
import {HoleMarkdown} from "../../components/home/hole";
import {IMAGE_BASE} from "../../constants/strings";
import TimeAgo from "react-native-timeago";
import Icon from "react-native-vector-icons/FontAwesome";
import {HoleCommentCard} from "../../models/home/hole";
import {getHoleComments} from "../../network/hole";
import {NetworkRetry} from "../../components/easySnackbars";

export const HoleDetailScreen = ({route}: {route: HoleDetailRouteProp}) => {
	const {pid, text, type, url, timestamp, reply, likenum} = route.params;
	const [comments, setComments] = useState<HoleCommentCard[]>([]);

	useEffect(() => {
		getHoleComments(pid).then(setComments).catch(NetworkRetry);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<ScrollView style={{paddingVertical: 8}}>
			<Text style={styles.smallHeader}>{getStr("originalText")}</Text>
			<View style={Material.card}>
				<Text style={styles.bigPid}>{`#${pid}`}</Text>
				<HoleMarkdown text={text} />
				{type === "image" && (
					<Image
						source={{uri: IMAGE_BASE + url}}
						style={{height: 400}}
						resizeMode="contain"
					/>
				)}
				<View style={{height: 1, backgroundColor: "#ccc", margin: 2}} />
				<View style={{flexDirection: "row", justifyContent: "space-between"}}>
					<TimeAgo time={timestamp * 1000} />
					<View style={{flexDirection: "row"}}>
						{reply > 0 && (
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
								}}>
								<Text>{reply}</Text>
								<Icon name="comment" size={12} />
							</View>
						)}
						{likenum > 0 && (
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
								}}>
								<Text>{likenum}</Text>
								<Icon name="star-o" size={12} />
							</View>
						)}
					</View>
				</View>
			</View>
			{reply > 0 && (
				<Text style={styles.smallHeader}>{getStr("comments")}</Text>
			)}
			{comments.map((item) => (
				<View style={Material.card} key={item.cid}>
					<Text style={styles.bigPid}>{`#${item.cid}`}</Text>
					<HoleMarkdown text={item.text} />
					<View style={{height: 1, backgroundColor: "#ccc", margin: 2}} />
					<TimeAgo time={item.timestamp * 1000} />
				</View>
			))}
		</ScrollView>
	);
};

export const styles = StyleSheet.create({
	smallHeader: {
		fontWeight: "bold",
		marginHorizontal: 10,
	},
	bigPid: {
		fontWeight: "bold",
		marginHorizontal: 12,
		marginBottom: 6,
		fontSize: 20,
	},
	smallCid: {
		fontWeight: "bold",
		marginHorizontal: 12,
		marginBottom: 6,
		fontSize: 16,
	},
});
