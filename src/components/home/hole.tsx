import React from "react";
import {
	URL_PID_RE,
	URL_RE,
	PID_RE,
	NICKNAME_RE,
	split_text,
} from "../../utils/textSplitter";
import renderMd from "../../utils/markdown";
import {Linking, Text, View} from "react-native";
import {Parser} from "htmlparser2";
import {DomHandler} from "domhandler";

const normalize_url = (url: string) =>
	/^https?:\/\//.test(url) ? url : "http://" + url;

const A = ({href, children}: {href: string | undefined; children: any}) => (
	<Text
		onPress={() => href && Linking.openURL(normalize_url(href))}
		style={{color: "blue"}}>
		{children}
	</Text>
);

interface Node {
	type: string;
	parent: Node | null;
	name?: string;
	data?: string;
	children?: Node[];
	attribs?: {[key: string]: string};
	startIndex?: number | null;
}

const mapNode = (node: Node) => {
	switch (node.type) {
		case "text":
			if (
				node.data &&
				node.data.trim().length > 0 &&
				!(
					node.parent &&
					node.parent.attribs &&
					node.parent.attribs.encoding === "application/x-tex"
				)
			) {
				const originalText = node.data;
				const splitted = split_text(originalText, [
					["url_pid", URL_PID_RE],
					["url", URL_RE],
					["pid", PID_RE],
					["nickname", NICKNAME_RE],
				]);

				return (
					<React.Fragment key={node.startIndex || -1}>
						{splitted.map(([rule, p]: [string, string], idx: number) => {
							return (
								<Text key={idx}>
									{rule === "url_pid" ? (
										<Text>/##</Text>
									) : rule === "url" ? (
										<A href={p}>{p}</A>
									) : rule === "pid" ? (
										<A href={undefined}>{p}</A>
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
			} else {
				return undefined;
			}
		case "tag":
			const children = node.children?.map(mapNode);
			switch (node.name) {
				case "p":
					return <Text key={node.startIndex || "p"}>{children}</Text>;
				case "h1":
				case "h2":
				case "h3":
				case "h4":
				case "h5":
				case "h6":
					return (
						<View key={node.startIndex || "h"}>
							<Text style={{fontSize: 20, lineHeight: 60, fontWeight: "bold"}}>
								{children}
							</Text>
						</View>
					);
				case "strong":
					return (
						<Text
							key={node.startIndex || "strong"}
							style={{fontWeight: "bold"}}>
							{children}
						</Text>
					);
				case "hr":
					return (
						<View
							key={node.startIndex || "hr"}
							style={{
								height: 1,
								backgroundColor: "#ccc",
								marginVertical: 6,
							}}
						/>
					);
				case "img":
					return <Text key={node.startIndex || "img"}>[图片]</Text>;
				case "a":
					return (
						<A key={node.startIndex || "a"} href={node?.attribs?.href}>
							{children}
						</A>
					);
				default:
					return undefined;
			}
		default:
			return undefined;
	}
};

export const HighlightedMarkdown = (props: any) => {
	const renderedMarkdown = renderMd(props.text);
	let result = <Text>{renderedMarkdown}</Text>;
	const parser = new Parser(
		new DomHandler(
			(error, dom) => {
				if (!error) {
					result = <View>{dom.map(mapNode)}</View>;
				}
			},
			{withStartIndices: true},
		),
	);
	parser.write(renderedMarkdown);
	parser.end();
	return result;
};
