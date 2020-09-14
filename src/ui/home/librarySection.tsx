import {getLibrarySectionList} from "../../network/library";
import {libraryRefreshListScreen} from "../../components/home/libraryRefreshListScreen";

export const LibrarySectionScreen = libraryRefreshListScreen(
	(props, dateChoice) => getLibrarySectionList(props.route.params, dateChoice),
	(props, item, choice) => () =>
		props.navigation.navigate("LibrarySeat", {
			section: item,
			dateChoice: choice,
		}),
);
