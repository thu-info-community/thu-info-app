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
import {SportsReservationRecord} from "thu-info-lib/dist/models/home/sports";
import {connect} from "react-redux";
import {State} from "../../redux/store";

export const SportsReservationCard = ({
	activeSportsReservationRecords,
}: {
	activeSportsReservationRecords: SportsReservationRecord[];
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const firstRecord = activeSportsReservationRecords[0];

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
				</>
			)}
		</RoundedView>
	);
};

const SportsUI = ({
	navigation,
	activeSportsReservationRecords,
}: {
	navigation: RootNav;
	activeSportsReservationRecords: SportsReservationRecord[] | undefined;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<ScrollView style={{flex: 1}}>
			<RoundedView
				style={{marginHorizontal: 12, marginVertical: 24, padding: 16}}>
				{sportsIdInfoList.map((info, index) => (
					<View key={info.name}>
						{index > 0 && (
							<View
								style={{
									borderWidth: 0.2,
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
				<SportsReservationCard
					activeSportsReservationRecords={activeSportsReservationRecords ?? []}
				/>
			</View>
		</ScrollView>
	);
};

export const SportsScreen = connect((state: State) => ({
	...state.reservation,
}))(SportsUI);
