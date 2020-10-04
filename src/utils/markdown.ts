import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
	html: false,
	linkify: false,
	breaks: true,
});

export default (text: string) => md.render(text).trim();
