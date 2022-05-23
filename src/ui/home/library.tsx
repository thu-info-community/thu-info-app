import {Text, TouchableOpacity, View} from "react-native";
import {RootNav} from "../../components/Root";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import React from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";

export const LibraryScreen = simpleRefreshListScreen(
	helper.getLibraryList,
	(item, _, {navigation}: {navigation: RootNav}, {colors}) => (
		<View>
			<TouchableOpacity
				style={{
					backgroundColor: colors.themeBackground,
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
						color: item.valid ? colors.text : "grey",
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
	undefined,
	({colors}) => (
		<View>
			<Text
				style={{
					fontWeight: "bold",
					fontSize: 16,
					alignSelf: "center",
					textAlign: "center",
					marginVertical: 20,
					color: colors.text,
				}}>
				{getStr(helper.mocked() ? "chooseLibraryMocked" : "chooseLibrary")}
			</Text>
			<View style={{backgroundColor: "lightgray", height: 1}} />
		</View>
	),
);
