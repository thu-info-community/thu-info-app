import {useFontScale} from "../../utils/useFontScale";

/**
 * A dimension grown to hold text rendered at the current system font scale.
 *
 * Use this for the *minimum* size of a control or cell that must contain a scaled
 * label (stepper buttons, picker chips, nav items, chips in a grid). It grows the
 * box; it never touches the glyphs, so a large-font user still reads real text and
 * nothing is clipped. Pass `max` only where a control genuinely must not exceed a
 * known bound.
 */
export const useScaledSize = (base: number, max?: number): number => {
	const {layoutScale} = useFontScale();
	const scaled = Math.round(base * layoutScale);
	return max === undefined ? scaled : Math.min(scaled, max);
};
