import {TouchableOpacity} from "react-native";
import IconStarActive from "../../assets/icons/IconStarActive";
import IconStar from "../../assets/icons/IconStar";

export const IconStarButton = ({
	active,
	onPress,
	size = 18,
}: {
	active: boolean;
	onPress: () => void;
	size?: number;
}) => {
	if (active) {
		return (
			<TouchableOpacity onPress={onPress} style={{marginLeft: 8}}>
				<IconStarActive height={size} width={size} />
			</TouchableOpacity>
		);
	} else {
		return (
			<TouchableOpacity onPress={onPress} style={{marginLeft: 8}}>
				<IconStar height={size} width={size} />
			</TouchableOpacity>
		);
	}
};
