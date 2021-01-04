import {Text, TouchableOpacity, View} from "react-native";
import {getLibraryList} from "../../network/library";
import {HomeNav} from "./homeStack";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import React from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import {getStr} from "src/utils/i18n";
import {mocked} from "../../redux/store";

export const LibraryScreen = simpleRefreshListScreen(
	getLibraryList,
	(item, _, {navigation}: {navigation: HomeNav}) => (
		<View>
			<TouchableOpacity
				style={{
					backgroundColor: "#ffffff",
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: 12,
				}}
				disabled={!item.valid}
				onPress={() =>
					item.valid &&
					navigation.navigate("LibraryFloor", {library: item, dateChoice: 0})
				}>
				<Text
					style={{
						fontSize: 14,
						textAlign: "left",
						textDecorationLine: item.valid ? "none" : "line-through",
						color: item.valid ? "black" : "grey",
						marginVertical: 14,
					}}>
					{item.zhName}
				</Text>
				<Icon name="angle-right" size={24} color="grey" />
			</TouchableOpacity>
			<View style={{backgroundColor: "lightgray", height: 1}} />
		</View>
	),
	(item) => String(item.id),
	mocked() ? undefined : (
		<View
			style={{
				padding: 6,
				margin: 4,
				alignItems: "center",
				marginHorizontal: 14,
			}}>
			<Text style={{textAlign: "center", lineHeight: 20, color: "gray"}}>
				{getStr("socketIntro")}
			</Text>
		</View>
	),
	<View>
		<Text
			style={{
				fontWeight: "bold",
				fontSize: 16,
				alignSelf: "center",
				textAlign: "center",
				marginVertical: 20,
			}}>
			{getStr(mocked() ? "chooseLibraryMocked" : "chooseLibrary")}
		</Text>
		<View style={{backgroundColor: "lightgray", height: 1}} />
	</View>,
);
