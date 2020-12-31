import React from "react";
import {
	URL_PID_RE,
	URL_RE,
	PID_RE,
	NICKNAME_RE,
	split_text,
} from "../../utils/textSplitter";
import {Linking, Text} from "react-native";
import Markdown from "react-native-markdown-display";
// @ts-ignore
import {docco} from "react-syntax-highlighter/src/styles/hljs";
// @ts-ignore
import SyntaxHighlighter from "react-native-syntax-highlighter";

export type NavigationHandler = (pid: number) => void;

const normalize_url = (url: string) =>
	/^https?:\/\//.test(url) ? url : "http://" + url;

const A = ({href, children}: {href: string | undefined; children: any}) => (
	<Text
		onPress={() => href && Linking.openURL(normalize_url(href))}
		style={{color: "blue"}}>
		{children}
	</Text>
);

const PidLink = ({
	pid,
	navigationHandler,
}: {
	pid: number;
	navigationHandler: NavigationHandler;
}) => (
	<Text onPress={() => navigationHandler(pid)} style={{color: "blue"}}>
		#{pid}
	</Text>
);

export const HoleMarkdown = ({
	text,
	navigationHandler,
}: {
	text: string;
	navigationHandler: NavigationHandler;
}) => {
	return (
		<Markdown
			rules={{
				text: (node) => {
					const splitted = split_text(node.content, [
						["url_pid", URL_PID_RE],
						["url", URL_RE],
						["pid", PID_RE],
						["nickname", NICKNAME_RE],
					]);

					return (
						<React.Fragment key={node.key}>
							{splitted.map(([rule, p]: [string, string], idx: number) => {
								return (
									<Text key={idx}>
										{rule === "url_pid" ? (
											<Text>/##</Text>
										) : rule === "url" ? (
											<A href={p}>{p}</A>
										) : rule === "pid" ? (
											<PidLink
												pid={Number(p.substring(1))}
												navigationHandler={navigationHandler}
											/>
										) : rule === "nickname" ? (
											<Text>{p}</Text>
										) : (
											p
										)}
									</Text>
								);
							})}
						</React.Fragment>
					);
				},
				heading1: (node, children, parent, styles) => (
					<Text key={node.key} style={[styles.heading, styles.heading3]}>
						{children}
					</Text>
				),
				heading2: (node, children, parent, styles) => (
					<Text key={node.key} style={[styles.heading, styles.heading3]}>
						{children}
					</Text>
				),
				heading3: (node, children, parent, styles) => (
					<Text key={node.key} style={[styles.heading, styles.heading3]}>
						{children}
					</Text>
				),
				heading4: (node, children, parent, styles) => (
					<Text key={node.key} style={[styles.heading, styles.heading4]}>
						{children}
					</Text>
				),
				heading5: (node, children, parent, styles) => (
					<Text key={node.key} style={[styles.heading, styles.heading5]}>
						{children}
					</Text>
				),
				heading6: (node, children, parent, styles) => (
					<Text key={node.key} style={[styles.heading, styles.heading6]}>
						{children}
					</Text>
				),
				fence: (node) => (
					<SyntaxHighlighter // @ts-ignore
						language={node.sourceInfo}
						style={docco}
						highlighter={"hljs"}
						key={node.key}>
						{node.content}
					</SyntaxHighlighter>
				),
			}}>
			{text}
		</Markdown>
	);
};
