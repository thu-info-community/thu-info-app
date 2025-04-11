import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({ width, height, color }: { width: number; height: number; color?: string }) => {
    if (!color) {
    const themeName = useColorScheme();
        const { colors } = themes(themeName);
        color = colors.fontB1;
    }
    return (
        <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
            <Path
            fillRule="evenodd"
            clipRule="evenodd"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 3H4C3.1 3 3 3.1 3 4V16C3 16.9 3.1 17 4 17H7V8C7 7.44772 7.44772 7 8 7H17V4C17 3.1 16.9 3 16 3Z"
            />
            <Path
            fillRule="evenodd"
            clipRule="evenodd"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7H20C20.9 7 21 7.1 21 8V20C21 20.9 20.9 21 20 21H8C7.1 21 7 20.9 7 20V8C7 7.1 7.1 7 8 7Z"
            />
        </Svg>
    );
};
