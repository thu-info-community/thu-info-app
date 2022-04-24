import React, {useEffect, useState} from "react";
import {
	GitLabCodeProp,
	GitLabMarkdownProp,
	RootNav,
} from "../../components/Root";
import {useColorScheme} from "react-native";
import {helper} from "../../redux/store";
import WebView from "react-native-webview";
import {encode} from "he";

export const GitlabCodeScreen = ({
	route: {
		params: {project, file},
	},
}: {
	navigation: RootNav;
	route: GitLabCodeProp;
}) => {
	const themeName = useColorScheme();

	const [content, setContent] = useState<string>();

	useEffect(() => {
		helper.getGitProjectFileBlob(project.id, file.id).then(setContent);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const adaptedHtml = `<head>
<meta name="viewport" content="width=100, initial-scale=1">
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.3.1/build/styles/default.min.css">
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.3.1/build/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
</head><body><pre><code>${encode(content ?? "")}</code></pre></body>`;

	return (
		<WebView
			source={{html: adaptedHtml}}
			style={{margin: 6}}
			forceDarkOn={themeName === "dark"}
		/>
	);
};

export const GitlabMarkdownScreen = ({
	route: {
		params: {project, file},
	},
}: {
	navigation: RootNav;
	route: GitLabMarkdownProp;
}) => {
	const themeName = useColorScheme();

	const [content, setContent] = useState<string>();

	useEffect(() => {
		helper
			.getGitProjectFileBlob(project.id, file.id)
			.then(helper.renderGitMarkdown)
			.then(setContent);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const adaptedHtml = `<head><meta name="viewport" content="width=100, initial-scale=1"></head><body>${content}</body>`;

	return (
		<WebView
			source={{html: adaptedHtml}}
			style={{margin: 6}}
			forceDarkOn={themeName === "dark"}
		/>
	);
};
