import {
	createContext,
	useState,
	Children,
	RefObject,
	FC,
	PropsWithChildren,
} from "react";
import {useColorScheme, View} from "react-native";
import {NavigationContainerRef} from "@react-navigation/native";
import themedStyles from "../utils/themedStyles";

const SplitViewContext = createContext<{
	detailNavigationContainerRef: RefObject<NavigationContainerRef<{}>> | null;
	showDetail: boolean;
	showMaster: boolean;
	toggleMaster: (show: boolean) => void;
}>({
	detailNavigationContainerRef: null,
	showDetail: false,
	showMaster: true,
	toggleMaster: () => {},
});

export interface SplitViewProps {
	splitEnabled: boolean;
	detailNavigationContainerRef: RefObject<NavigationContainerRef<{}>> | null;
	showDetail: boolean;
}

const SplitViewProvider: FC<PropsWithChildren<SplitViewProps>> = ({
	splitEnabled,
	detailNavigationContainerRef,
	showDetail,
	children,
}) => {
	const [showMaster, setShowMaster] = useState(true);
	const themeName = useColorScheme();
	const style = styles(themeName);

	return (
		<SplitViewContext.Provider
			value={{
				detailNavigationContainerRef,
				showDetail,
				showMaster,
				toggleMaster: setShowMaster,
			}}>
			{splitEnabled ? (
				<View style={style.root}>
					<View
						style={[
							style.master,
							{flex: showDetail ? 0 : 1, display: showMaster ? "flex" : "none"},
						]}>
						{Children.toArray(children)[0]}
					</View>
					{showDetail && <View style={style.divider} />}
					<View style={[style.detail, {display: showDetail ? "flex" : "none"}]}>
						{Children.toArray(children)[1]}
					</View>
				</View>
			) : (
				<>{Children.toArray(children)[0]}</>
			)}
		</SplitViewContext.Provider>
	);
};

const styles = themedStyles(({colors}) => ({
	root: {
		flexDirection: "row",
		flex: 1,
	},
	master: {
		width: 320,
		zIndex: 2,
	},
	detail: {
		flex: 1,
	},
	divider: {
		height: "100%",
		width: 1,
		backgroundColor: colors.themeGrey,
	},
}));

export {SplitViewContext, SplitViewProvider};
