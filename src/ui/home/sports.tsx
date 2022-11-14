import {
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React from "react";
import {sportsIdInfoList} from "thu-info-lib/dist/lib/sports";
import themes from "../../assets/themes/themes";
import {RootNav} from "../../components/Root";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {getStr} from "../../utils/i18n";
import {useSelector} from "react-redux";
import {State} from "../../redux/store";
import {useNavigation} from "@react-navigation/native";

export const SportsReservationCard = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const activeSportsReservationRecords =
		useSelector((s: State) => s.reservation.activeSportsReservationRecords) ??
		[];

	const firstRecord = activeSportsReservationRecords[0];

	const navigation = useNavigation<RootNav>();

	return (
		<RoundedView
			style={{
				alignItems: "center",
				justifyContent: "center",
			}}>
			{firstRecord === undefined ? (
				<Text style={{color: colors.text}}>
					{getStr("noActiveSportsReservationRecord")}
				</Text>
			) : (
				<>
					<Text style={{color: colors.text}}>{firstRecord.name}</Text>
					<View
						style={{
							padding: 10,
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Text
							style={{
								fontSize: 20,
								fontWeight: "600",
								color: colors.text,
							}}>
							{firstRecord.field}
						</Text>
					</View>
					<Text style={{textAlign: "center", color: colors.text}}>
						{firstRecord.time}
					</Text>
					{firstRecord.payId && (
						<TouchableOpacity
							onPress={() =>
								firstRecord.payId &&
								navigation.navigate("SportsSelectTitle", {
									payId: firstRecord.payId,
								})
							}>
							<Text style={{textAlign: "center", color: colors.statusWarning}}>
								{getStr("pay")}
							</Text>
						</TouchableOpacity>
					)}
				</>
			)}
		</RoundedView>
	);
};

export const SportsScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<ScrollView style={{flex: 1}}>
			<RoundedView
				style={{marginHorizontal: 12, marginVertical: 24, padding: 16}}>
				{([] as typeof sportsIdInfoList).map((info, index) => (
					<View key={info.name}>
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
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
							}}
							onPress={() => {
								navigation.navigate("SportsDetail", {info});
							}}>
							<Text
								style={{
									color: colors.text,
									fontSize: 16,
									lineHeight: 24,
								}}>
								{info.name}
							</Text>
							<IconRight height={24} width={24} />
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
			<View style={{margin: 16}}>
				<Text
					style={{
						fontWeight: "bold",
						color: colors.text,
						marginBottom: 8,
					}}>
					{getStr("alreadyReserved")}
				</Text>
				<SportsReservationCard />
			</View>
		</ScrollView>
	);
};
