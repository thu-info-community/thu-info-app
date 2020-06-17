import "react-native-gesture-handler";
import {AppRegistry} from "react-native";
import {name} from "./app.json";
import {App} from "./src/App";

AppRegistry.registerComponent(name, () => App);
