import {useColorScheme} from "react-native";
import themes from "../themes/themes";
import IconAssistant from "./IconAssistant";

export default ({size, active}: {size: number; active: boolean}) => {
	const {colors} = themes(useColorScheme());

	return (
		<IconAssistant
			width={size}
			height={size}
			color={active ? colors.themePurple : colors.fontB2}
		/>
	);
};
