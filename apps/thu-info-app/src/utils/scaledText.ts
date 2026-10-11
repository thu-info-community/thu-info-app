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
