import {useEffect, useState} from "react";
import {RootNav} from "../../components/Root";
import {
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import dayjs from "dayjs";
import {RoundedView} from "../../components/views";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {LibRoomInfo} from "thu-info-lib/dist/models/home/library";

export const LibRoomSelectScreen = ({navigation}: {navigation: RootNav}) => {
	const [libraries, setLibraries] = useState<LibRoomInfo[]>([]);
	const [libSelected, setLibSelected] = useState<number | undefined>(undefined);
	const [refreshing, setRefreshing] = useState(false);

	const today = dayjs();
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const validDateNum = 5;
	const format = "YYYY-MM-DD";

	const refresh = () => {
		setRefreshing(true);
		helper
			.getLibraryRoomBookingInfoList()
			.then(setLibraries)
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, []);

	return (
		<ScrollView
			style={{flex: 1}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}>
			<RoundedView
				style={{marginHorizontal: 12, marginVertical: 24, padding: 16}}>
				{libraries.map((lib, index) => (
					<View key={lib.kindName + lib.kindId}>
						{index > 0 && (
							<View
								style={{
									borderWidth: 0.4,
									borderColor: colors.themeGrey,
									marginVertical: 12,
								}}
							/>
						)}
						<TouchableOpacity
							onPress={() => setLibSelected(lib.kindId)}
							style={{
								flexDirection: "row",
								alignItems: "center",
							}}>
							<Text
								style={{
									color: colors.text,
									fontSize: 16,
									lineHeight: 24,
								}}>
								{lib.kindName}
							</Text>
						</TouchableOpacity>
						{lib.kindId === libSelected &&
							Array.from(new Array(validDateNum), (_, k) =>
								today.add(k, "day"),
							).map((date, dateOffset) => (
								<View key={`${lib.kindName}-r-${date.date()}`}>
									<View
										style={{
											borderWidth: 0.4,
											borderColor: colors.themeGrey,
											marginVertical: 12,
										}}
									/>
									<TouchableOpacity
										onPress={() =>
											navigation.navigate("LibRoomBook", {
												dateOffset: dateOffset,
												kindId: lib.kindId,
												kindName: lib.kindName,
											})
										}>
										<Text
											style={{
												marginLeft: 16,
												color: colors.text,
												fontSize: 16,
												lineHeight: 24,
											}}>
											{date.format(format)} {getStr("dayOfWeek")[date.day()]}
										</Text>
									</TouchableOpacity>
								</View>
							))}
					</View>
				))}
			</RoundedView>
		</ScrollView>
	);
};
