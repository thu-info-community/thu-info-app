import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RootNav, SportsSuccessProp} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {getStr} from "src/utils/i18n";
import {RoundedView} from "../../components/views";
import IconSuccess from "../../assets/icons/IconSuccess";

const Row = ({left, right}: {left: string; right: string}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				marginTop: 12,
			}}>
			<Text style={{color: colors.fontB3, fontSize: 16}}>{left}</Text>
			<Text style={{color: colors.text, fontSize: 16}}>{right}</Text>
		</View>
	);
};

export const SportsSuccessScreen = ({
	navigation,
	route,
}: {
	navigation: RootNav;
	route: SportsSuccessProp;
}) => {
	const {
		info: {name},
		date,
		phone,
		period,
		availableFields,
		selectedFieldIndex,
	} = route.params;

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<RoundedView style={{marginTop: 36, paddingVertical: 0, borderRadius: 20}}>
			<View
				style={{
					height: 211,
					backgroundColor: colors.themePurple,
					borderTopStartRadius: 20,
					borderTopEndRadius: 20,
					alignItems: "center",
					justifyContent: "center",
				}}>
				<IconSuccess height={128} width={128} />
			</View>
			<View style={{margin: 36}}>
				<Row left={getStr("gym")} right={name} />
				<Row left={getStr("date")} right={date} />
				<Row left={getStr("duration")} right={period} />
				{selectedFieldIndex !== undefined && (
					<Row
						left={getStr("field")}
						right={availableFields[selectedFieldIndex].name}
					/>
				)}
				<View style={{height: 12}} />
				<Row left={getStr("phoneNumber")} right={phone} />
				{selectedFieldIndex !== undefined && (
					<Row
						left={getStr("paid")}
						right={`￥${availableFields[selectedFieldIndex].cost}`}
					/>
				)}
				<View style={{height: 12}} />
				<TouchableOpacity
					style={{
						padding: 8,
						justifyContent: "center",
						alignItems: "center",
						borderRadius: 4,
						alignSelf: "flex-end",
						backgroundColor: colors.themePurple,
					}}
					onPress={() => {
						navigation.replace("SportsRecord");
					}}>
					<Text
						style={{
							color: "white",
							fontWeight: "400",
							fontSize: 16,
							lineHeight: 20,
						}}>
						{getStr("pay")}
					</Text>
				</TouchableOpacity>
			</View>
		</RoundedView>
	);
};
