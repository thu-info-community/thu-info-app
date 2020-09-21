/* eslint-disable no-undef */
import React, {useContext, useEffect, useState} from "react";
import MarkdownWebView from "react-native-github-markdown";
import {
	Button,
	FlatList,
	RefreshControl,
	Text,
	View,
	Dimensions,
} from "react-native";
import {getSecondaryVerbose} from "../../network/schedule";
import {NetworkRetry} from "../../components/easySnackbars";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {submitSecondaryErr} from "../../utils/leanCloud";
import Snackbar from "react-native-snackbar";

// @ts-ignore
const markdown = preval`
      const fs = require('fs');
      const path = require('path');
      let str;
      if (process.cwd().includes("ios")) {
        	str = fs.readFileSync(path.resolve(process.cwd(), '../src/assets/mds/secondary_zh.md'), 'utf8');
      } else {
        	str = fs.readFileSync(path.resolve(process.cwd(), './src/assets/mds/secondary_zh.md'), 'utf8');
      }
      module.exports = str;
`;

export const SecondarySettingsScreen = () => {
	const [data, setData] = useState<[string, string, boolean][]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

	const refresh = () => {
		setRefreshing(true);
		getSecondaryVerbose()
			.then(setData)
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, []);

	let screenHeight = Dimensions.get("window");

	return (
		<>
			<MarkdownWebView
				style={{backgroundColor: "transparent", flex: 1}}
				content={markdown}
			/>
			<View
				style={{
					shadowColor: "gray",
					shadowOffset: {
						width: 0,
						height: 1,
					},
					shadowRadius: 3,
					shadowOpacity: 0.8,
					height: 2,
					backgroundColor: "lightgray",
				}}
			/>
			<FlatList
				style={{
					flex: 1,
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				data={data}
				renderItem={({item}) => (
					<View
						style={{
							flexDirection: "row",
							marginVertical: 5,
							padding: 10,
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Text style={{flex: 1, textAlign: "center"}}>{item[0]}</Text>
						<Text style={{flex: 1, textAlign: "center"}}>{item[1]}</Text>
						<Text style={{flex: 1, textAlign: "center"}}>
							{item[2] ? getStr("success") : getStr("failure")}
						</Text>
					</View>
				)}
				keyExtractor={(item, index) => item[0] + item[1] + item[2] + index}
				ListHeaderComponent={
					<View>
						{data.length !== 0 && (
							<View
								style={{
									flexDirection: "row",
									marginVertical: 5,
									padding: 10,
									paddingTop: 20,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Text
									style={{
										flex: 1,
										textAlign: "center",
										fontSize: 16,
										fontWeight: "bold",
									}}>
									{getStr("courseName")}
								</Text>
								<Text
									style={{
										flex: 1,
										textAlign: "center",
										fontSize: 16,
										fontWeight: "bold",
									}}>
									{getStr("courseTime")}
								</Text>
								<Text
									style={{
										flex: 1,
										textAlign: "center",
										fontSize: 16,
										fontWeight: "bold",
									}}>
									{getStr("state")}
								</Text>
							</View>
						)}
					</View>
				}
				ListFooterComponent={() => (
					<>
						{data.some((it) => !it[2]) && (
							<View>
								<Button
									title={getStr("sendErrReport")}
									onPress={() => {
										const err = data.filter((it) => !it[2]).map((it) => it[1]);
										submitSecondaryErr(String(err))
											.then(() =>
												Snackbar.show({
													text: getStr("feedbackSuccess"),
													duration: Snackbar.LENGTH_SHORT,
												}),
											)
											.catch(NetworkRetry);
									}}
								/>
								<Text />
							</View>
						)}
						{data.length === 0 && (
							<View
								style={{
									height: screenHeight.height * 0.35,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Text
									style={{
										textAlign: "center",
										fontWeight: "bold",
										fontSize: 16,
									}}>
									{getStr("emptyList")}
								</Text>
							</View>
						)}
					</>
				)}
			/>
		</>
	);
};
