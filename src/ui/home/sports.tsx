import {
	Alert,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React, {useEffect, useState} from "react";
import dayjs from "dayjs";
import {sportsIdInfoList} from "thu-info-lib/dist/lib/sports";
import themes from "../../assets/themes/themes";
import {HomeNav} from "./homeStack";
import {getStr} from "../../utils/i18n";

export const SportsScreen = ({navigation}: {navigation: HomeNav}) => {
	const [nameStr, setNameStr] = useState(getStr("sportsBook"));
	const [idGym, setIdGym] = useState<string>();
	const [idItem, setIdItem] = useState<string>();

	const today = dayjs();
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const validDateNum = 4;

	useEffect(() => {
		Alert.alert("试验性功能", "有 bug 请务必及时反馈！");
	}, []);

	return (
		<View style={{flexDirection: "row", margin: 10}}>
			<View style={{flex: 1, paddingRight: 10}}>
				{sportsIdInfoList.map(({name, gymId, itemId}, index) => (
					<View
						key={name}
						style={{
							borderTopColor: "lightgrey",
							borderTopWidth: 1,
							borderBottomColor: "lightgrey",
							borderBottomWidth: index === sportsIdInfoList.length - 1 ? 1 : 0,
						}}>
						<TouchableOpacity
							onPress={() => {
								setNameStr(name);
								setIdGym(gymId);
								setIdItem(itemId);
							}}>
							<Text
								style={{
									color: idItem === itemId ? colors.accent : colors.text,
									padding: 10,
								}}>
								{name}
							</Text>
						</TouchableOpacity>
					</View>
				))}
			</View>
			<View style={{flex: 1, paddingLeft: 10}}>
				{idGym !== undefined &&
					idItem !== undefined &&
					Array.from(new Array(validDateNum), (_, k) =>
						today.add(k, "day").format("YYYY-MM-DD"),
					).map((dateStr, index) => (
						<View
							key={dateStr}
							style={{
								borderTopColor: "lightgrey",
								borderTopWidth: 1,
								borderBottomColor: "lightgrey",
								borderBottomWidth: index === validDateNum - 1 ? 1 : 0,
							}}>
							<TouchableOpacity
								onPress={() =>
									navigation.navigate("SportsDetail", {
										info: {name: nameStr, gymId: idGym, itemId: idItem},
										date: dateStr,
									})
								}>
								<Text style={{padding: 10, color: colors.text}}>{dateStr}</Text>
							</TouchableOpacity>
						</View>
					))}
			</View>
		</View>
	);
};
