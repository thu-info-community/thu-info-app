import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";
import {LibrarySection} from "../../helper/src";
import {helper} from "../../redux/store";

export const LibrarySectionScreen = libraryRefreshListScreen<
	LibrarySection,
	"LibrarySection"
>(
	(props, dateChoice: 0 | 1) =>
		helper.getLibrarySectionList(props.route.params.floor, dateChoice),
	(props, item, choice) => () =>
		props.navigation.navigate("LibrarySeat", {
			section: item,
			dateChoice: choice,
		}),
);
