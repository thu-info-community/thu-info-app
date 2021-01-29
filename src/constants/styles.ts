import themedStyles from "../utils/themedStyles";

export const Material = themedStyles(({colors}) => ({
	card: {
		margin: 10,
		padding: 10,
		backgroundColor: colors.background,
		shadowColor: "grey",
		shadowOffset: {
			width: 2,
			height: 2,
		},
		shadowOpacity: 0.8,
		shadowRadius: 2,
		borderRadius: 5,
		elevation: 2,
	},
}));
