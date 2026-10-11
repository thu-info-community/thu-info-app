import {useMemo} from "react";
import {useWindowDimensions} from "react-native";
import {
	FontTier,
	fontTierOf,
	isLargeText as isLargeTextOf,
	isVeryLargeText as isVeryLargeTextOf,
	layoutScale as layoutScaleOf,
} from "./fontScale";

export interface FontScale {
	/** The window's font scale, never `NaN` or below 1's guard value. */
	fontScale: number;
	tier: FontTier;
	isLargeText: boolean;
	isVeryLargeText: boolean;
	/** See `layoutScale` in `./fontScale`. */
	layoutScale: number;
}

/**
 * The current system text scale and the tier it falls in.
 *
 * Deliberately separate from `useResponsive`: that hook is mocked with a fixed
 * shape in `test/scheduleScreen.test.tsx`, so folding `fontScale` into it would
 * hand `undefined` to every reader there and produce `NaN`. Reading
 * `useWindowDimensions` subscribes to dimension changes, so on platforms that
 * hot-apply a font-size change the layout re-runs instead of staying stale.
 */
export const useFontScale = (): FontScale => {
	const {fontScale} = useWindowDimensions();
	return useMemo(() => {
		// Guard the unset/`NaN` case (tests, some RNOH builds) so downstream maths
		// degrade to "no scaling" instead of poisoning every number with `NaN`.
		const safe = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
		return {
			fontScale: safe,
			tier: fontTierOf(safe),
			isLargeText: isLargeTextOf(safe),
			isVeryLargeText: isVeryLargeTextOf(safe),
			layoutScale: layoutScaleOf(safe),
		};
	}, [fontScale]);
};
