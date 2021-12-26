import React, {PropsWithChildren, useState} from "react";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {ProjectItem} from "../../components/home/gitlab";
import {HomeNav} from "./homeStack";
import {TextInput, TouchableOpacity, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import Icon from "react-native-vector-icons/FontAwesome";
import Snackbar from "react-native-snackbar";

export const GitlabSearchScreen = (props: {navigation: HomeNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [search, setSearch] = useState("");

	return paginatedRefreshListScreen(
		async (_: PropsWithChildren<{navigation: HomeNav}>, page) =>
			search.length === 0 ? [] : helper.searchGitProjects(search, page),
		(project, _, {navigation}) => (
			<ProjectItem
				project={project}
				onPress={() => {
					Snackbar.show({
						text: getStr("loading"),
						duration: Snackbar.LENGTH_SHORT,
					});
					helper
						.getGitProjectDetail(project.id)
						.then((r) => navigation.navigate("GitLabProject", {project: r}));
				}}
			/>
		),
		({id}) => String(id),
		undefined,
		(_, refresh) => (
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingVertical: 8,
					paddingHorizontal: 12,
				}}>
				<TextInput
					style={{
						fontSize: 15,
						flex: 1,
						backgroundColor: colors.background,
						color: colors.text,
						textAlign: "left",
						borderColor: "lightgrey",
						borderWidth: 1,
						borderRadius: 5,
						padding: 6,
					}}
					placeholder={getStr("search")}
					value={search}
					onChangeText={setSearch}
				/>
				<TouchableOpacity
					onPress={refresh}
					style={{padding: 6, paddingLeft: 12}}>
					<Icon name="search" size={20} />
				</TouchableOpacity>
			</View>
		),
	)(props);
};
