import {useState} from "react";
import {RootNav} from "../../components/Root";
import {
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
import {LibName, validLibName} from "thu-info-lib/dist/models/home/library";

export const LibRoomSelectScreen = ({navigation}: {navigation: RootNav}) => {
	const [libSelected, setLibSelected] = useState<LibName | undefined>(
		undefined,
	);

	const today = dayjs();
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const validDateNum = 5;
	const format = "YYYY-MM-DD";

	return (
		<ScrollView style={{flex: 1}}>
			<RoundedView
				style={{marginHorizontal: 12, marginVertical: 24, padding: 16}}>
				{validLibName.map((libName, index) => (
					<View key={libName}>
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
							onPress={() => setLibSelected(libName)}
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
								{getStr(libName)}
							</Text>
						</TouchableOpacity>
						{libName === libSelected &&
							Array.from(new Array(validDateNum), (_, k) =>
								today.add(k, "day"),
							).map((date, dateOffset) => (
								<View key={`${libName}-r-${date.date()}`}>
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
												libName: libName,
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
