/* eslint-disable no-undef */
import React, {useContext, useEffect, useState} from "react";
import MarkdownWebView from "react-native-github-markdown";
import {Button, FlatList, RefreshControl, Text, View} from "react-native";
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

	return (
		<>
			<MarkdownWebView
				style={{backgroundColor: "transparent", flex: 1}}
				content={markdown}
			/>
			<FlatList
				style={{flex: 1}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				data={data}
				renderItem={({item}) => (
					<View style={{flexDirection: "row"}}>
						<Text style={{flex: 1}}>{item[0]}</Text>
						<Text style={{flex: 1}}>{item[1]}</Text>
						<Text style={{flex: 1}}>{item[2] ? "成功" : "失败"}</Text>
					</View>
				)}
				keyExtractor={(item, index) => item[0] + item[1] + item[2] + index}
				ListFooterComponent={() => (
					<>
						{data.some((it) => !it[2]) && (
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
						)}
						{data.length === 0 && (
							<Text style={{textAlign: "center"}}>{getStr("emptyList")}</Text>
						)}
					</>
				)}
			/>
		</>
	);
};
