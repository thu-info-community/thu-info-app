import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";
import {LibraryFloor} from "../../helper/src/models/home/library";
import {helper} from "../../redux/store";

export const LibraryFloorScreen = libraryRefreshListScreen<
	LibraryFloor,
	"LibraryFloor"
>(
	(props, dateChoice) =>
		helper.getLibraryFloorList(props.route.params.library, dateChoice),
	(props, item, choice) => () => {
		if (!helper.mocked()) {
			props.navigation.navigate("LibrarySection", {
				floor: item,
				dateChoice: choice,
			});
		}
	},
);
