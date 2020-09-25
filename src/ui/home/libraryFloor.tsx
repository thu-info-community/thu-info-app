import {getLibraryFloorList} from "../../network/library";
import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";
import {LibraryFloor} from "../../models/home/library";
import {mocked} from "../../redux/store";
import React from "react";
import {View} from "react-native";

export const LibraryFloorScreen = libraryRefreshListScreen<
	LibraryFloor,
	"LibraryFloor"
>(
	(props, dateChoice) =>
		getLibraryFloorList(props.route.params.library, dateChoice),
	(props, item, choice) => () => {
		if (!mocked()) {
			props.navigation.navigate("LibrarySection", {
				floor: item,
				dateChoice: choice,
			});
		}
	},
	<View style={{backgroundColor: "lightgray", height: 1}} />,
);
