/**
 * System text-scaling policy for large-font (大字体) robustness.
 *
 * The app lets text scale with the OS (`allowFontScaling` defaults to true), so at
 * `font_scale 2.0` a 16pt label renders at 32. A large font then breaks any box
 * whose height/width/`lineHeight`/`numberOfLines` was chosen in pixels, so the pass
 * that reads these helpers grows the *box* to hold the scaled text instead of
 * shrinking the text.
 *
 * `layoutScale` is the only place anything is capped, and it caps *geometry* -- how
 * much extra room to reserve -- never the glyphs: the requirement is that all
 * content stays visible, so the layout grows rather than the type shrinking.
 */

/** Android's "Large" .. "Largest" band starts around here. */
export const LARGE_TEXT_MIN_SCALE = 1.3;

/** The "XL" band and the iOS accessibility sizes. */
export const XLARGE_TEXT_MIN_SCALE = 1.7;

/** Geometry never needs to grown past the largest system setting we support. */
export const MAX_LAYOUT_SCALE = 2;

export type FontTier = "normal" | "large" | "xlarge";

export const fontTierOf = (fontScale: number): FontTier =>
	fontScale >= XLARGE_TEXT_MIN_SCALE
		? "xlarge"
		: fontScale >= LARGE_TEXT_MIN_SCALE
		? "large"
		: "normal";

export const isLargeText = (fontScale: number): boolean =>
	fontTierOf(fontScale) !== "normal";

export const isVeryLargeText = (fontScale: number): boolean =>
	fontTierOf(fontScale) === "xlarge";

/**
 * The factor by which to grow geometry (minimum sizes, reserved padding, grid
 * cells) so it can hold text rendered at `fontScale`.
 *
 * A scale below 1 is the system "small text" setting: text is honoured, but it
 * never shrinks geometry below its shipped size. The result is clamped to
 * `MAX_LAYOUT_SCALE` for callers that pass no explicit `max`.
 */
export const layoutScale = (
	fontScale: number,
	max: number = MAX_LAYOUT_SCALE,
): number =>
	Number.isFinite(fontScale)
		? Math.min(Math.max(fontScale, 1), Math.max(1, max))
		: 1;
