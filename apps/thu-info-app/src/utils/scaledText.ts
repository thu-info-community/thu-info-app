/**
 * Helpers for text whose line box must track the system font scale.
 *
 * A literal `lineHeight` beside a `fontSize` that still scales is a defect: at
 * `font_scale 2.0` the glyphs double but the line box stays fixed, so consecutive
 * lines overlap. Either drop the literal (React Native derives a sane line height
 * from the font) or derive it here so it grows with the text exactly as the glyphs
 * do -- a slight over-estimate is fine, an under-estimate smears the text.
 */

/** The guarded system scale, so an unset/`NaN` value degrades to "no scaling". */
export const safeFontScale = (fontScale: number): number =>
	Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;

/**
 * The line height to use for text that renders at `baseLineHeight` when the
 * system is at `fontScale`. A scale below 1 shrinks the box too, matching how the
 * glyphs shrink; the caller is responsible for pairing this with a `fontSize`
 * that is allowed to scale (i.e. not `allowFontScaling={false}`).
 */
export const scaledLineHeight = (
	baseLineHeight: number,
	fontScale: number,
): number => Math.round(baseLineHeight * safeFontScale(fontScale));

/**
 * Android only. Spread onto a `Text` that renders a label which can wrap.
 *
 * React Native pins every Android `Text` to `BREAK_STRATEGY_SIMPLE` +
 * `HYPHENATION_FREQUENCY_NONE` (see `ReactTextView`), and that legacy breaker has
 * no break opportunity inside a word: when a word is wider than the line it is
 * cut at an arbitrary character (`Dormitor` / `y`). `highQuality` switches to the
 * ICU breaker and `full` turns on its hyphenator, so the break lands on a syllable
 * and carries a hyphen (`Dormi-` / `tory`). It also means Android ignores the soft
 * hyphens `hyphenateLatinWords` inserts -- those cover the other platforms, where
 * this prop is a no-op.
 */
export const ANDROID_HYPHENATION = {
	textBreakStrategy: "highQuality",
	android_hyphenationFrequency: "full",
} as const;
