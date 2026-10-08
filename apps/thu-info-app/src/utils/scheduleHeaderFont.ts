/**
 * Sizing the schedule header's date and weekday labels to the cell they sit in.
 *
 * `ui/schedule/schedule.tsx` computes that cell's width from the screen, while
 * the labels' font sizes were fixed at 9pt/12pt -- and React Native still
 * multiplied those by the system font scale. On a narrow phone with a large
 * system font the text outgrew the cell and the last character was clipped, so
 * `10/02` rendered as `10/0`.
 *
 * The size is therefore derived from the cell instead, and the labels are
 * rendered with the system multiplier switched off. That is the only way the
 * number computed here is the number that renders on every platform: on iOS the
 * multiplier comes from the Dynamic Type category rather than the numeric
 * `fontScale`, and on HarmonyOS it is whatever the Harmony text engine applies.
 * The cost is that these two labels can only ever shrink from the size the app
 * ships, never grow with the system setting.
 */

/** Hard floor, dp. Below this a date stops being legible. */
export const SCHEDULE_HEADER_MIN_FONT = 7;

/** The header cell's own padding in `ui/schedule/schedule.tsx` -- keep in sync. */
export const SCHEDULE_HEADER_CELL_PADDING = 4;

/** Room for font-metric differences between platforms and for raster rounding. */
export const SCHEDULE_HEADER_SAFETY_DP = 2;

/**
 * Advance width per glyph, in em. Full-width glyphs are 1em by definition;
 * half-width ones are estimated at 0.62em against a real ~0.56em for digits and
 * ~0.30em for `/`, so the estimate is deliberately at the high end: a label may
 * come out slightly smaller than strictly needed, never wider than its cell.
 */
const FULL_WIDTH_ADVANCE_EM = 1;
const HALF_WIDTH_ADVANCE_EM = 0.62;

/** Emit a half-dp granularity: fine enough to be invisible, coarse enough to cache. */
const HALF_DP = 0.5;

const isFullWidth = (codePoint: number): boolean =>
	(codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
	(codePoint >= 0x2e80 && codePoint <= 0xa4cf) || // CJK radicals .. Yi
	(codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul syllables
	(codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK compatibility ideographs
	(codePoint >= 0xfe30 && codePoint <= 0xfe6f) || // CJK compatibility forms
	(codePoint >= 0xff00 && codePoint <= 0xff60) || // full-width forms
	(codePoint >= 0xffe0 && codePoint <= 0xffe6);

export const scheduleHeaderGlyphAdvanceEm = (text: string): number => {
	let advance = 0;
	for (const glyph of text) {
		advance += isFullWidth(glyph.codePointAt(0) ?? 0)
			? FULL_WIDTH_ADVANCE_EM
			: HALF_WIDTH_ADVANCE_EM;
	}
	return advance;
};

export interface ScheduleHeaderFontOptions {
	/** Cell width in dp -- the grid's `unitWidth`. `<= 0` means "not measured yet". */
	unitWidth: number;
	/** The exact string the label will render. */
	text: string;
	/** The size the app ships for this label, and its hard upper bound. */
	baseSize: number;
	/** The window's font scale. At or above 1 it never enlarges the label. */
	fontScale: number;
	/** Defaults to `SCHEDULE_HEADER_CELL_PADDING`. */
	cellPadding?: number;
}

export interface ScheduleHeaderFontResult {
	/** Pass as `fontSize`, together with `allowFontScaling={false}`. */
	fontSize: number;
	/**
	 * True when even the floor does not fit. Unreachable on shipping hardware --
	 * it needs a window narrower than ~270dp at seven columns.
	 */
	overflow: boolean;
}

export const scheduleHeaderFontSize = ({
	unitWidth,
	text,
	baseSize,
	fontScale,
	cellPadding = SCHEDULE_HEADER_CELL_PADDING,
}: ScheduleHeaderFontOptions): ScheduleHeaderFontResult => {
	// Before the first `onLayout` the grid is zero wide and paints nothing at
	// all, so keep the shipped size instead of pinning the label to the floor:
	// should `onLayout` never arrive, the row degrades to today's look.
	if (!(unitWidth > 0)) {
		return {fontSize: baseSize, overflow: false};
	}
	const usable = unitWidth - 2 * cellPadding - SCHEDULE_HEADER_SAFETY_DP;
	const advance = scheduleHeaderGlyphAdvanceEm(text);
	if (usable <= 0) {
		return {fontSize: SCHEDULE_HEADER_MIN_FONT, overflow: true};
	}
	// A font scale below 1 is the system's "small text" setting: honour it, and
	// still fit. At or above 1 `desired` is exactly `baseSize`.
	const desired = Math.min(
		Math.max(baseSize * fontScale, SCHEDULE_HEADER_MIN_FONT),
		baseSize,
	);
	const fitted = Math.min(usable / advance, desired);
	const fontSize = Math.max(
		SCHEDULE_HEADER_MIN_FONT,
		Math.min(fitted, baseSize),
	);
	return {
		// Round down, so rounding can never push the label past the width it was
		// fitted to.
		fontSize: Math.floor(fontSize / HALF_DP) * HALF_DP,
		overflow: SCHEDULE_HEADER_MIN_FONT * advance > usable,
	};
};
