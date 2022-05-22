import {
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React, {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {CrSearchResultRouteProp, RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {CrTimeoutError} from "thu-info-lib/dist/utils/error";
import {CrSearchResultInfo} from "thu-info-lib/dist/models/cr/cr";
import {CourseTimeQuickGlance} from "../../components/home/cr";

export const CrSearchResultScreen = ({
	route,
	navigation,
}: {
	route: CrSearchResultRouteProp;
	navigation: RootNav;
}) => {
	const [searchResult, setSearchResult] = useState<CrSearchResultInfo[]>([]);
	const [page, setPage] = useState<number>(1);
	const [totalPage, setTotalPage] = useState<number | undefined>();
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = (force: boolean) => {
		if (!force && totalPage !== undefined && page >= totalPage) {
			return;
		}
		setRefreshing(true);
		helper
			.searchCrCourses({
				...route.params.searchParams,
				page: force ? 1 : page + 1,
			})
			.then((r) => {
				setSearchResult((prev) => (force ? r.courses : prev.concat(r.courses)));
				setTotalPage(r.totalPage);
				setPage(r.currPage);
			})
			.catch((e) => {
				if (e instanceof CrTimeoutError) {
					navigation.navigate("CrCaptcha");
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
	useEffect(() => refresh(true), []);

	return (
		<FlatList
			style={{flex: 1}}
			data={searchResult}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={() => refresh(true)}
					colors={[colors.accent]}
				/>
			}
			renderItem={({
				item: {
					id,
					name,
					seq,
					teacher,
					capacity,
					remaining,
					queue,
					time,
					credits,
				},
			}) => (
				<TouchableOpacity
					onPress={() => {
						Snackbar.show({
							text: "选课功能还在开发中，敬请期待……",
							duration: Snackbar.LENGTH_SHORT,
						});
					}}
					style={{
						paddingHorizontal: 15,
						paddingVertical: 6,
						flexDirection: "row",
						justifyContent: "space-between",
					}}>
					<View style={{flex: 2, alignItems: "flex-start"}}>
						<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
							{name}
						</Text>
						<Text style={{marginVertical: 2, color: colors.text}}>
							{teacher}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{id}-{seq} ({credits} pts)
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{getStr("courseTime")} {time}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{getStr("courseRemaining")} {remaining}/{capacity}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{getStr("courseQueue")} {queue}
						</Text>
					</View>
					<View
						style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
						<CourseTimeQuickGlance time={time} width={7 * 15} height={6 * 15} />
					</View>
				</TouchableOpacity>
			)}
			keyExtractor={({id, seq}) => `${id}-${seq}`}
			onEndReached={() => refresh(false)}
		/>
	);
};
