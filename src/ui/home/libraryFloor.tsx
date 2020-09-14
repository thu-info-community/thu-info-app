import {getLibraryFloorList} from "../../network/library";
import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";
import {LibraryFloor} from "../../models/home/library";

export const LibraryFloorScreen = libraryRefreshListScreen<
	LibraryFloor,
	"LibraryFloor"
>(
	(props, dateChoice) =>
		getLibraryFloorList(props.route.params.library, dateChoice),
	(props, item, choice) => () => {
		props.navigation.navigate("LibrarySection", {
			floor: item,
			dateChoice: choice,
		});
	},
);
