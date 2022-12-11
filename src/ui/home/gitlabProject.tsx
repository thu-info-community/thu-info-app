import React, {useEffect, useState} from "react";
import {GitLabProjectProp, RootNav} from "../../components/Root";
import {Modal, ScrollView, Text, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import {SettingsItem} from "../../components/settings/items";
import {helper, State} from "../../redux/store";
import {Branch, File} from "thu-info-lib/dist/models/gitlab/gitlab";
import AutoheightWebView from "../../components/AutoheightWebView";
import {getStr} from "../../utils/i18n";
import {BranchItem} from "../../components/home/gitlab";
import {useSelector} from "react-redux";

export const GitlabProjectScreen = ({
	navigation,
	route: {
		params: {project},
	},
}: {
	navigation: RootNav;
	route: GitLabProjectProp;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [branch, setBranch] = useState(project.default_branch);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [modalShow, setModalShow] = useState(false);
	const [readmeFile, setReadmeFile] = useState<File | undefined>(undefined);
	const [readmeFileContent, setReadmeFileContent] = useState<
		string | undefined
	>(undefined);
	const dark = useSelector((s: State) => s.config.darkMode);

	useEffect(() => {
		setReadmeFile(undefined);
		setReadmeFileContent(undefined);
		(async () => {
			for (let page = 1; ; page++) {
				const files = await helper.getGitProjectTree(
					project.id,
					"",
					branch,
					page,
				);
				if (files.length === 0) {
					break;
				}
				for (const file of files) {
					if (file.type === "blob" && file.name.toLowerCase() === "readme.md") {
						return file;
					}
				}
			}
			return undefined;
		})().then((readme) => {
			setReadmeFile(readme);
			if (readme) {
				helper
					.getGitProjectFileBlob(project.id, readme.id)
					.then(helper.renderGitMarkdown)
					.then(setReadmeFileContent);
			}
		});
	}, [branch, project.id]);

	const adaptedHtml = `<head><meta name="viewport" content="width=100, initial-scale=1"></head><body>${readmeFileContent}</body>`;

	return (
		<ScrollView>
			<Modal
				animationType="slide"
				transparent={true}
				visible={modalShow}
				onRequestClose={() => {}}>
				<View style={{flex: 1, justifyContent: "center"}}>
					<View style={{marginHorizontal: 30, backgroundColor: "#EEE"}}>
						{branches.map(({name}) => (
							<BranchItem
								name={name}
								key={name}
								onPress={() => {
									setBranch(name);
									setModalShow(false);
								}}
							/>
						))}
					</View>
				</View>
			</Modal>
			<View
				style={{
					paddingHorizontal: 5,
					paddingVertical: 12,
					backgroundColor: "#F8F8F8",
				}}>
				<Text
					style={{
						fontSize: 15,
						marginHorizontal: 10,
						marginVertical: 3,
						color: "grey",
					}}>
					{project.path_with_namespace}
				</Text>
				<Text
					style={{
						fontSize: 21,
						marginHorizontal: 10,
						marginVertical: 3,
						color: colors.text,
						fontWeight: "bold",
					}}>
					{project.name}
				</Text>
				{project.description?.trim().length > 0 && (
					<Text
						style={{
							fontSize: 15,
							marginHorizontal: 10,
							marginVertical: 6,
							color: "grey",
						}}>
						{project.description}
					</Text>
				)}
				<View
					style={{
						flexDirection: "row",
						marginHorizontal: 10,
						marginVertical: 3,
						alignItems: "center",
					}}>
					{/* <Icon name="star-o" size={18} color="grey" /> */}
					<Text style={{paddingHorizontal: 6, fontSize: 16, color: "grey"}}>
						{project.star_count}
					</Text>
					{/* <Icon name="code-fork" size={18} color="grey" /> */}
					<Text style={{paddingHorizontal: 6, fontSize: 16, color: "grey"}}>
						{project.forks_count}
					</Text>
				</View>
			</View>
			<SettingsItem
				text={branch}
				onPress={() => {
					helper.getGitProjectBranches(project.id).then((b) => {
						setBranches(b);
						setModalShow(b.length > 0);
					});
				}}
				icon={undefined /* <Feather name="git-branch" size={20} /> */}
			/>
			<SettingsItem
				text={getStr("gitlabViewCode")}
				onPress={() =>
					navigation.navigate("GitLabTree", {project, path: "", ref: branch})
				}
				icon={undefined /* <Feather name="code" size={20} /> */}
			/>
			{readmeFile !== undefined && readmeFileContent !== undefined && (
				<>
					<View
						style={{
							flexDirection: "row",
							paddingHorizontal: 8,
							marginTop: 8,
							alignItems: "center",
						}}>
						{/* <Feather name="info" size={20} color="grey" /> */}
						<Text style={{marginLeft: 8, fontSize: 15, color: "grey"}}>
							{readmeFile.name}
						</Text>
					</View>
					<AutoheightWebView
						source={{html: adaptedHtml}}
						style={{margin: 6}}
						forceDarkOn={dark || themeName === "dark"}
					/>
				</>
			)}
		</ScrollView>
	);
};
