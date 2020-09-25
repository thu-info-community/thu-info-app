import {getLibrarySectionList} from "../../network/library";
import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";
import {LibrarySection} from "../../models/home/library";

export const LibrarySectionScreen = libraryRefreshListScreen<
	LibrarySection,
	"LibrarySection"
>(
	(props, dateChoice: 0 | 1) =>
		getLibrarySectionList(props.route.params.floor, dateChoice),
	(props, item, choice) => () =>
		props.navigation.navigate("LibrarySeat", {
			section: item,
			dateChoice: choice,
		}),
);
