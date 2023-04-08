import Svg, {Path} from "react-native-svg";
import themes from "../themes/themes";
import {useColorScheme} from "react-native";

export default ({width, height}: { width?: number; height?: number }) => {
    const themeName = useColorScheme();
    const theme = themes(themeName);
    return (
        <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
            <Path d="M24 36V30"
                  stroke={theme.colors.fontB1} strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"/>
            <Path d="M20 40H6"
                  stroke={theme.colors.fontB1}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"/>
            <Path d="M28 40H42"
                  stroke={theme.colors.fontB1}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"/>
            <Path
                d="M28 40C28 42.2091 26.2091 44 24 44C21.7909 44 20 42.2091 20 40C20 37.7909 21.7909 36 24 36C26.2091 36 28 37.7909 28 40Z"
                fill={theme.colors.mainTheme}
                stroke={theme.colors.fontB1}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"/>
            <Path
                d="M37 17C37 24.1797 31.1797 30 24 30C16.8203 30 11 24.1797 11 17M37 17C37 9.8203 31.1797 4 24 4C16.8203 4 11 9.8203 11 17M37 17H11"
                fill={theme.colors.mainTheme}
                stroke={theme.colors.fontB1}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"/>
            <Path
                d="M29 17C29 24.1797 26.7614 30 24 30C21.2386 30 19 24.1797 19 17C19 9.8203 21.2386 4 24 4C26.7614 4 29 9.8203 29 17Z"
                stroke={theme.colors.fontB1}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"/>
            <Path d="M37 17H11"
                  stroke={theme.colors.fontB1}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"/>
        </Svg>
    );
};
