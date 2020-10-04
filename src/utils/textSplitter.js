/* eslint-disable @typescript-eslint/no-shadow*/
/* eslint-disable curly*/
// See: https://github.com/thuhole/webhole/blob/master/src/text_splitter.js

// regexp should match the WHOLE segmented part
// export const PID_RE=/(^|[^\d\u20e3\ufe0e\ufe0f])([2-9]\d{4,5}|1\d{4,6})(?![\d\u20e3\ufe0e\ufe0f])/g;
export const PID_RE = /(^|[^\d\u20e3\ufe0e\ufe0f])(#\d{1,7})(?![\d\u20e3\ufe0e\ufe0f])/g;
// TODO: fix this re
// export const URL_PID_RE=/((?:https?:\/\/)?thuhole\.com\/?#(?:#|%23)([2-9]\d{4,5}|1\d{4,6}))(?!\d|\u20e3|\ufe0e|\ufe0f)/g;
export const URL_PID_RE = /((?:https?:\/\/)?thuhole\.com\/?#(?:#|%23)(\d{1,7}))(?!\d|\u20e3|\ufe0e|\ufe0f)/g;
export const NICKNAME_RE = /(^|[^A-Za-z])((?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Jolly|Kind|Little|Magic|Naïve|Old|PKU|Quiet|Rich|Superman|Tough|Undefined|Valuable|Wifeless|Xiangbuchulai|Young|Zombie)\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win(?: \d+)?|洞主)(?![A-Za-z])/gi;
export const URL_RE = /(^|[^.@a-zA-Z0-9_])((?:https?:\/\/)?(?:(?:[\w-]+\.)+[a-zA-Z]{2,3}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d{1,5})?(?:\/[\w~!@#$%^&*()\-_=+[\]{};:,./?|]*)?)(?![a-zA-Z0-9])/gi;

export function split_text(txt, rules) {
	// rules: [['name',/regex/],...]
	// return: [['name','part'],[null,'part'],...]

	txt = [[null, txt]];
	rules.forEach((rule) => {
		let [name, regex] = rule;
		txt = [].concat.apply(
			[],
			txt.map((part) => {
				let [rule, content] = part;
				if (rule)
					// already tagged by previous rules
					return [part];
				else {
					return content
						.split(regex)
						.map((seg) => (regex.test(seg) ? [name, seg] : [null, seg]))
						.filter(([name, seg]) => name !== null || seg);
				}
			}),
		);
	});
	return txt;
}
