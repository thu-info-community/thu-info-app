import {useMemo} from "react";
import {useWindowDimensions} from "react-native";

/** Width at or above which the floating tab bar replaces the native one. */
export const MEDIUM_MIN_WIDTH = 600;

/** Width at or above which a screen may lay out in two columns. */
export const EXPANDED_MIN_WIDTH = 800;

/**
 * Height below which two columns are not worth the lost vertical space. Phone
 * landscape (844x390) fails this while iPad landscape (1194x834) passes.
 */
export const EXPANDED_MIN_HEIGHT = 620;

export type FormFactor = "compact" | "medium" | "expanded";

export interface Responsive {
	/** Window width in dp. */
	width: number;
	/** Window height in dp. */
	height: number;
	formFactor: FormFactor;
	/** Floating tab bar and a full-width single column. */
	isWide: boolean;
	/** Two-column capable. */
	isExpanded: boolean;
}

/**
 * The single source of truth for wide-screen breakpoints — phones, tablets,
 * unfolded foldables and tri-folds all land in one of three tiers.
 *
 * Use this rather than `Dimensions.get("window")`, which samples once at module
 * or render time and never re-reads. That is why an app started with the fold
 * closed used to keep its phone layout after unfolding: nothing re-rendered.
 * `useWindowDimensions` subscribes to `didUpdateDimensions`, so unfolding,
 * rotating and resizing all re-run the layout.
 */
export const useResponsive = (): Responsive => {
	const {width, height} = useWindowDimensions();

	return useMemo(() => {
		const formFactor: FormFactor =
			width >= EXPANDED_MIN_WIDTH && height >= EXPANDED_MIN_HEIGHT
				? "expanded"
				: width >= MEDIUM_MIN_WIDTH
				? "medium"
				: "compact";

		return {
			width,
			height,
			formFactor,
			isWide: formFactor !== "compact",
			isExpanded: formFactor === "expanded",
		};
	}, [width, height]);
};
