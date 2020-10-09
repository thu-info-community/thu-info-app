import {Image, StyleSheet, Text, View} from "react-native";
import React from "react";
import {HoleDetailRouteProp} from "./homeStack";
import {getStr} from "../../utils/i18n";
import {Material} from "../../constants/styles";
import {HoleMarkdown} from "../../components/home/hole";
import {IMAGE_BASE} from "../../constants/strings";
import TimeAgo from "react-native-timeago";
import Icon from "react-native-vector-icons/FontAwesome";

export const HoleDetailScreen = ({route}: {route: HoleDetailRouteProp}) => {
	const {pid, text, type, url, timestamp, reply, likenum} = route.params;
	return (
		<View style={{paddingVertical: 8}}>
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
			<Text style={styles.smallHeader}>{getStr("comments")}</Text>
		</View>
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
});
