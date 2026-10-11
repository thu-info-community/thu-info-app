/**
 * Column geometry for a day/hour grid (the schedule week grid and anything shaped
 * like it).
 *
 * Kept pure and explicit: at a large system font a day cell needs a minimum width
 * for its scaled labels, and past that the grid has to scroll horizontally rather
 * than clip. The caller folds the font scale into `minCellWidth` (see
 * `minCellWidthForLabels` in `./textMetrics`) before calling this, so nothing here
 * reads `Dimensions` or `fontScale` behind the caller's back.
 *
 * At `fontScale` 1 with a `minCellWidth` small enough to fit, `"fit"` reproduces
 * today's layout exactly: the wider of a shrunk-to-fit column and the cap.
 */

export interface GridGeometryInput {
	/** Width available to the grid, excluding any fixed gutter/axis. */
	contentWidth: number;
	/** Number of day columns to lay out. */
	dayCount: number;
	/** The widest a single column may get before it looks empty. */
	maxUnitWidth: number;
	/**
	 * The narrowest a column may be while still fitting its scaled labels. When
	 * `dayCount * minCellWidth` exceeds the available width the grid overflows and
	 * must scroll instead of clipping.
	 */
	minCellWidth: number;
	/** A fixed gutter/axis width subtracted from `contentWidth`. Defaults to 0. */
	gutterWidth?: number;
}

export interface GridGeometry {
	mode: "fit" | "overflow";
	/** Per-column width in dp. */
	unitWidth: number;
	/** Total width of all columns in dp. */
	gridWidth: number;
	/** True when the grid must live in a horizontal scroller. */
	scrollable: boolean;
}

export const computeGridGeometry = ({
	contentWidth,
	dayCount,
	maxUnitWidth,
	minCellWidth,
	gutterWidth = 0,
}: GridGeometryInput): GridGeometry => {
	const body = Math.max(0, contentWidth - gutterWidth);
	const days = Math.max(1, dayCount);
	const min = Math.max(0, minCellWidth);
	if (min > 0 && days * min > body) {
		return {
			mode: "overflow",
			unitWidth: min,
			gridWidth: min * days,
			scrollable: true,
		};
	}
	const unitWidth = Math.min(body / days, maxUnitWidth);
	return {
		mode: "fit",
		unitWidth,
		gridWidth: unitWidth * days,
		scrollable: false,
	};
};
