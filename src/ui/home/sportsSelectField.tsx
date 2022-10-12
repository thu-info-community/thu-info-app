import React, {useState} from "react";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import IconCheck from "../../assets/icons/IconCheck";
import {RootNav, SportsSelectFieldProp} from "../../components/Root";
import {styles} from "../settings/settings";

export const SportsSelectFieldScreen = ({
	route: {params},
	navigation,
}: {
	route: SportsSelectFieldProp;
	navigation: RootNav;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	const [indexSelected, setIndexSelected] = useState<number | undefined>(
		params.selectedFieldIndex,
	);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				{params.availableFields.map(({id, name, cost}, index) => (
					<View key={id}>
						{index > 0 && <View style={style.separator} />}
						<TouchableOpacity
							style={style.touchable}
							onPress={() => {
								setIndexSelected(index);
								const {routes} = navigation.getState();
								const prevRoute = routes[routes.length - 2].name;
								if (prevRoute === "SportsDetail") {
									navigation.replace("SportsSelect", {
										...params,
										selectedFieldIndex: index,
									});
								} else {
									navigation.navigate("SportsSelect", {
										...params,
										selectedFieldIndex: index,
									});
								}
							}}>
							<Text style={style.text}>{`${name}（${cost}元）`}</Text>
							{index === indexSelected && <IconCheck width={18} height={18} />}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</View>
	);
};
