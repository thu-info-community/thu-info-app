import {PropsWithChildren, useState} from "react";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {ProjectItem} from "../../components/home/gitlab";
import {RootNav} from "../../components/Root";
import {TextInput, TouchableOpacity, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import IconSearch from "../../assets/icons/IconSearch";
import Snackbar from "react-native-snackbar";

export const GitlabSearchScreen = (props: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [search, setSearch] = useState("");

	return paginatedRefreshListScreen(
		async (_: PropsWithChildren<{navigation: RootNav}>, page) =>
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
						backgroundColor: colors.themeBackground,
						color: colors.text,
						textAlign: "left",
						borderColor: "lightgrey",
						borderWidth: 1,
						borderRadius: 5,
						padding: 6,
					}}
					placeholder={getStr("search")}
					placeholderTextColor={colors.fontB3}
					value={search}
					onChangeText={setSearch}
				/>
				<TouchableOpacity
					onPress={refresh}
					style={{padding: 6, paddingLeft: 12}}>
					<IconSearch width={20} height={20} />
				</TouchableOpacity>
			</View>
		),
	)(props);
};
