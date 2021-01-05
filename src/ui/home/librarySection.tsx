import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";
import {helper} from "../../redux/store";
import {LibrarySection} from "thu-info-lib/lib/models/home/library";

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
