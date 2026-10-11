/**
 * The adaptive entry point for the sub-page kit.
 *
 * `./tokens` holds the shipped spacing/radius/fontSize values and is deliberately
 * frozen (its contract is that every value equals an existing on-screen value). A
 * large system font needs behaviour beyond those constants, so rather than change
 * them this module re-exports the tokens unchanged and adds the policy a sub-page
 * should follow: read the font scale through `useFontScale`, grow control geometry
 * with `useScaledSize`, and lay text-bearing rows out with `components/adaptive`.
 */
export * from "./tokens";
export {useFontScale} from "../../utils/useFontScale";
export {useScaledSize} from "../adaptive/scaledBox";
export {AdaptiveRow, AdaptiveLabelValueRow} from "../adaptive/rows";
export {AdaptiveBadge} from "../adaptive/badge";
export type {FontTier} from "../../utils/fontScale";
export {LARGE_TEXT_MIN_SCALE, XLARGE_TEXT_MIN_SCALE} from "../../utils/fontScale";
