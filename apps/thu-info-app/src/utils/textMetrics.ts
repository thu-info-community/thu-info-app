/**
 * Width estimates for fitting labels into a fixed grid cell.
 *
 * The schedule grid derives its column width from the screen, so the weekday and
 * date labels have to be accounted for explicitly. `scheduleHeaderFont` used these
 * estimates to *shrink* the label (and switched scaling off); the large-font pass
 * instead widens the cell (`minCellWidthForLabels`) and lets the label scale.
 */

/**
 * Advance width per glyph, in em. Full-width glyphs are 1em by definition;
 * half-width ones are estimated at 0.62em against a real ~0.56em for digits and
 * ~0.30em for `/`, so the estimate is deliberately at the high end: a cell may
 * come out slightly wider than strictly needed, never narrower than its label.
 */
const FULL_WIDTH_ADVANCE_EM = 1;
const HALF_WIDTH_ADVANCE_EM = 0.62;

/** Room for font-metric differences between platforms and for raster rounding. */
const CELL_SAFETY_DP = 2;

const isFullWidth = (codePoint: number): boolean =>
	(codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
	(codePoint >= 0x2e80 && codePoint <= 0xa4cf) || // CJK radicals .. Yi
	(codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul syllables
	(codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK compatibility ideographs
	(codePoint >= 0xfe30 && codePoint <= 0xfe6f) || // CJK compatibility forms
	(codePoint >= 0xff00 && codePoint <= 0xff60) || // full-width forms
	(codePoint >= 0xffe0 && codePoint <= 0xffe6);

export const textGlyphAdvanceEm = (text: string): number => {
	let advance = 0;
	for (const glyph of text) {
		const codePoint = glyph.codePointAt(0) ?? 0;
		// A soft hyphen (U+00AD) is invisible and takes no space; hyphenated
		// labels must measure the same as their plain form.
		if (codePoint === 0x00ad) {
			continue;
		}
		advance += isFullWidth(codePoint)
			? FULL_WIDTH_ADVANCE_EM
			: HALF_WIDTH_ADVANCE_EM;
	}
	return advance;
};

export interface MinCellWidthOptions {
	/** The exact strings that will render in the cell, in any order. */
	labels: string[];
	/** The size the app ships for these labels, at font scale 1. */
	baseFontSize: number;
	/** The window's font scale; the label is expected to render at its product. */
	fontScale: number;
	/** Horizontal padding inside the cell. Defaults to 0. */
	cellPadding?: number;
	/** Extra slack for platform metric differences. Defaults to `CELL_SAFETY_DP`. */
	safetyDp?: number;
}

/**
 * The smallest cell width (dp) that fully contains the widest of `labels` at the
 * scaled font size. Round up, so a computed width can never clip its label.
 */
export const minCellWidthForLabels = ({
	labels,
	baseFontSize,
	fontScale,
	cellPadding = 0,
	safetyDp = CELL_SAFETY_DP,
}: MinCellWidthOptions): number => {
	const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
	const widestEm = labels.reduce(
		(max, label) => Math.max(max, textGlyphAdvanceEm(label)),
		0,
	);
	return Math.ceil(baseFontSize * scale * widestEm + 2 * cellPadding + safetyDp);
};
