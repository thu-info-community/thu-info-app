import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {
	SecondaryItem,
	secondaryItemIconSize,
	SecondaryItemSeparator,
	styles,
} from "../../components/home/secondaryItems";
import IconLibrary from "../../assets/icons/IconLibrary";
import IconSports from "../../assets/icons/IconSports";
import IconLibRoom from "../../assets/icons/IconLibRoom";

export const ReserveScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	return (
		<View style={style.SecondaryRootView}>
			<View style={style.SecondaryContentView}>
				<SecondaryItem
					title="library"
					destKey="library"
					icon={
						<IconLibrary
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("Library");
					}}
				/>
				<SecondaryItemSeparator />
				<SecondaryItem
					title="sportsBook"
					destKey="sportsBook"
					icon={
						<IconSports
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("Sports");
					}}
				/>
				<SecondaryItemSeparator />
				<SecondaryItem
					title="libRoomBook"
					destKey="libRoomBook"
					icon={
						<IconLibRoom
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("LibRoomBook");
					}}
				/>
			</View>
		</View>
	);
};
