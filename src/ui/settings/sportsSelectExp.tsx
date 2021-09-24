import React, {useState} from "react";
import {
	Button,
	Image,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {SettingsNav, SportsSelectProp} from "./settingsStack";
import themes from "../../assets/themes/themes";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import {doAlipay} from "../../utils/alipay";

export const SportsSelectScreen = ({
	route: {
		params: {
			info: {name, gymId, itemId},
			date,
			phone,
			availableFields,
		},
	},
	navigation,
}: {
	route: SportsSelectProp;
	navigation: SettingsNav;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [field, setField] = useState<{id: string; name: string} | undefined>(
		undefined,
	);
	const [imageUrl, setImageUrl] = useState(helper.getSportsCaptchaUrl());
	const [captcha, setCaptcha] = useState("");
	const [totalCost, setTotalCost] = useState(0);
	console.log(imageUrl);

	return (
		<ScrollView>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{name}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{date}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{phone}</Text>
			</View>
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>{getStr("selectField")}</Text>
			</View>
			{availableFields.map((f) => (
				<View
					style={{borderTopColor: "lightgrey", borderTopWidth: 1}}
					key={f.id}>
					<TouchableOpacity
						onPress={() => {
							setField(f);
							setTotalCost(f.cost);
						}}>
						<Text
							style={{
								padding: 10,
								color:
									field === undefined
										? colors.text
										: f.id === field.id
										? "blue"
										: "lightgrey",
							}}>
							{f.name}
						</Text>
					</TouchableOpacity>
				</View>
			))}
			<View style={{borderTopColor: "lightgrey", borderTopWidth: 1}}>
				<Text style={{padding: 10}}>总计{totalCost}元</Text>
			</View>
			<View
				style={{
					borderTopColor: "lightgrey",
					borderTopWidth: 1,
					borderBottomColor: "lightgrey",
					borderBottomWidth: 1,
					flexDirection: "row",
					alignItems: "center",
				}}>
				<Image source={{uri: imageUrl}} style={{height: 50, width: 200}} />
				<TextInput
					style={{flex: 1}}
					value={captcha}
					onChangeText={setCaptcha}
					placeholder={getStr("captchaCaseSensitive")}
				/>
				<Button
					title={getStr("refresh")}
					onPress={() => setImageUrl(helper.getSportsCaptchaUrl())}
				/>
			</View>
			<TouchableOpacity
				style={{
					backgroundColor:
						field === undefined || captcha.trim().length === 0
							? "lightgrey"
							: colors.accent,
					marginTop: 10,
				}}
				onPress={() => {
					if (field !== undefined) {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						helper
							.makeSportsReservation(
								totalCost,
								phone,
								gymId,
								itemId,
								date,
								captcha,
								field.id,
							)
							.then(doAlipay)
							.then(() => navigation.pop())
							.catch(NetworkRetry);
					}
				}}
				disabled={field === undefined || captcha.trim().length === 0}>
				<Text
					style={{
						fontSize: 20,
						padding: 10,
						color: colors.background,
						textAlign: "center",
					}}>
					{getStr("submit")}
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};
