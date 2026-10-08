import {StyleSheet} from "react-native";
import {ColorTheme} from "../../assets/themes/themes";

/**
 * Spacing/radius/typography values for sub-page layouts.
 *
 * These encode dimensions the app already uses (12/16/24 screen padding, radius
 * 12/20, font sizes 13-20) so migrating a screen onto the shared kit is pixel
 * neutral. Do not introduce a token that changes an existing on-screen value.
 */
export const spacing = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24} as const;

export const radius = {control: 8, card: 12, hub: 20} as const;

export const fontSize = {
	caption: 13,
	label: 14,
	body: 16,
	title: 18,
	display: 20,
} as const;

export const layout = {
	screenPadding: spacing.md,
	maxContentWidth: 640,
	sectionGap: spacing.md,
} as const;

/** Hairline separator matching the settings-section-list rows. */
export const separatorStyle = (colors: ColorTheme) => ({
	borderBottomWidth: StyleSheet.hairlineWidth,
	borderBottomColor: colors.themeGrey,
});
