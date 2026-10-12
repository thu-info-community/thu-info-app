import {hyphenated} from "hyphenated";

/**
 * U+00AD SOFT HYPHEN. It is invisible on its own; the platform only renders a
 * hyphen when the line actually breaks there — exactly what a word too wide for
 * its cell needs.
 */
export const SOFT_HYPHEN = "\u00AD";

/**
 * Strings that must not be hyphenated: e-mail addresses, paths, URLs and
 * version-like tokens. Hyphenating `myhome.tsinghua.edu.cn` would split the host
 * into `my-home` / `ts-inghua`, so anything containing an `@`, a `/`, or a dot
 * between two word characters is left alone.
 */
const NOT_WORD_LIKE = /@|\/|\w\.\w/;

/** A run of Latin letters long enough for the pattern set to find a break in. */
const HAS_HYPHENATABLE_WORD = /[A-Za-z]{5,}/;

const MAX_CACHE = 512;
const cache = new Map<string, string>();

/**
 * Insert soft hyphens at the syllable points of the English words in `text`, so
 * a word that has to break at the end of a line breaks cleanly (`Dormi-` /
 * `tory`) instead of anywhere (`Dormitor` / `y`). A word that fits is untouched:
 * the soft hyphen stays invisible until the line breaks there.
 *
 * Chinese text and URL/e-mail-like strings are returned unchanged, and the
 * function is idempotent — feeding it its own output changes nothing.
 */
export const hyphenateLatinWords = (text: string): string => {
	if (!HAS_HYPHENATABLE_WORD.test(text) || NOT_WORD_LIKE.test(text)) {
		return text;
	}

	// Strip any soft hyphens already present so the call stays idempotent before
	// handing the plain word to the engine.
	const base = text.split(SOFT_HYPHEN).join("");
	const cached = cache.get(base);
	if (cached !== undefined) {
		return cached;
	}

	const result = hyphenated(base);
	if (cache.size < MAX_CACHE) {
		cache.set(base, result);
	}
	return result;
};
