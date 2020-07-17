import {createContext} from "react";
import themes from "./themes";

export const ThemeContext = createContext<keyof typeof themes>("light");
