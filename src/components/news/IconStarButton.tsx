import {TouchableOpacity} from "react-native";
import IconStarActive from "../../assets/icons/IconStarActive";
import IconStar from "../../assets/icons/IconStar";
import React from "react";

export const IconStarButton = ({
	active,
	onPress,
}: {
	active: boolean;
	onPress: () => void;
}) => {
	if (active) {
		return (
			<TouchableOpacity onPress={onPress} style={{marginLeft: 8}}>
				<IconStarActive height={18} width={18} />
			</TouchableOpacity>
		);
	} else {
		return (
			<TouchableOpacity onPress={onPress} style={{marginLeft: 8}}>
				<IconStar height={18} width={18} />
			</TouchableOpacity>
		);
	}
};
