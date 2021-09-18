import React, {useState} from "react";
import {
	Button,
	Linking,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {
	SettingsEditText,
	SettingsEditValue,
} from "../../components/settings/items";
import {
	waterBrandIdToName,
	getWaterUserInformation,
	postWaterSubmission,
} from "../../network/water";
import DropDownPicker from "react-native-dropdown-picker";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import themes from "../../assets/themes/themes";

const checkNum = (num: number) => num >= 0 && Math.floor(num) === num;

export const WaterScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const {colors} = theme;

	const [id, setId] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [waterNumber, setWaterNumber] = useState(1);
	const [ticketNumber, setTicketNumber] = useState(0);
	const [brand, setBrand] = useState("6");
	const [open, setOpen] = useState(false);
	const [brandList, setBrandList] = useState(
		Object.keys(waterBrandIdToName).map((v) => ({
			label: waterBrandIdToName[v],
			value: v,
		})),
	);

	return (
		<ScrollView style={{padding: 20}}>
			<Text style={{fontSize: 24, alignSelf: "center"}}>在线订购</Text>
			<SettingsEditText
				text="档案号"
				value={id}
				onValueChange={(v) => {
					setId(v);
					getWaterUserInformation(v).then((r) => {
						setPhone(r.phone ?? "");
						setAddress(r.address ?? "");
					});
				}}
				placeholder=""
				enabled={true}
			/>
			<SettingsEditText
				text="电话"
				value={phone}
				onValueChange={setPhone}
				placeholder=""
				enabled={false}
			/>
			<SettingsEditText
				text="地址"
				value={address}
				onValueChange={setAddress}
				placeholder=""
				enabled={false}
			/>
			<SettingsEditValue
				text="订水量"
				value={waterNumber}
				onValueChange={setWaterNumber}
			/>
			<SettingsEditValue
				text="订水票量"
				value={ticketNumber}
				onValueChange={setTicketNumber}
			/>
			<DropDownPicker
				open={open}
				value={brand}
				items={brandList}
				setOpen={setOpen}
				setValue={setBrand}
				setItems={setBrandList}
			/>
			<View style={{marginVertical: 20}}>
				<Button
					title={getStr("confirm")}
					onPress={() => {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						postWaterSubmission(
							id,
							String(waterNumber),
							String(ticketNumber),
							brand,
							address,
						)
							.then(() => {
								Snackbar.show({
									text: "订水成功！",
									duration: Snackbar.LENGTH_LONG,
								});
							})
							.catch(NetworkRetry);
					}}
					disabled={
						id.trim().length === 0 ||
						phone.trim().length === 0 ||
						address.trim().length === 0 ||
						!checkNum(waterNumber) ||
						!checkNum(ticketNumber)
					}
				/>
			</View>
			<TouchableOpacity
				onPress={() =>
					Linking.openURL("https://github.com/THUzxj").then(() =>
						console.log("Opening THUzxj GitHub page in system explorer"),
					)
				}>
				<Text style={{color: colors.primaryLight}}>作者：THUzxj @ GitHub</Text>
			</TouchableOpacity>
			<Text style={{marginTop: 8, color: "red"}}>
				{
					"该功能是接入 THUInfo 的新功能，尚未经过充分测试，因此如遇任何问题请及时向我们反馈～"
				}
			</Text>
		</ScrollView>
	);
};
