import React, {useEffect, useState} from "react";
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
import ModalDropdown from "react-native-modal-dropdown";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import themes from "../../assets/themes/themes";
import {connect} from "react-redux";
import {helper, State} from "../../redux/store";
import {configSet} from "../../redux/actions/config";

const checkNum = (num: number) => num >= 0 && Math.floor(num) === num;

const WaterUI = ({
	waterId,
	waterBrand,
	setWaterId,
	setWaterBrand,
}: {
	waterId: string | undefined;
	waterBrand: string;
	setWaterId: (id: string) => void;
	setWaterBrand: (brand: string) => void;
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const {colors} = theme;

	const [correspondent, setCorrespondent] = useState("");
	const [address, setAddress] = useState("");
	const [waterNumber, setWaterNumber] = useState(1);
	const [ticketNumber, setTicketNumber] = useState(0);
	const [brand, setBrand] = useState(waterBrand);

	useEffect(() => {
		if (waterId !== undefined) {
			getWaterUserInformation(waterId).then((r) => {
				setCorrespondent(r.name ?? "");
				setAddress(r.address ?? "");
			});
		}
	}, [waterId]);

	useEffect(() => {
		setWaterBrand(brand);
	}, [setWaterBrand, brand]);

	return (
		<ScrollView style={{padding: 20}}>
			<Text style={{fontSize: 24, alignSelf: "center", color: colors.text}}>
				在线订购
			</Text>
			<SettingsEditText
				text="档案号"
				value={waterId ?? ""}
				onValueChange={(v) => {
					setWaterId(v);
				}}
				placeholder=""
				enabled={true}
			/>
			<SettingsEditText
				text="联系人"
				value={correspondent}
				onValueChange={setCorrespondent}
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
			<ModalDropdown
				options={Object.values(waterBrandIdToName)}
				defaultValue={waterBrandIdToName["6"]}
				style={{
					padding: 8,
					borderWidth: 1,
					borderRadius: 4,
					borderColor: "gray",
				}}
				textStyle={{
					fontSize: 14,
					color: colors.text,
				}}
				dropdownStyle={{
					paddingHorizontal: 20,
				}}
				dropdownTextStyle={{
					color: "black",
					fontSize: 14,
				}}
				showsVerticalScrollIndicator={false}
				onSelect={(_, value) =>
					setBrand(
						Object.keys(waterBrandIdToName).find(
							(k) => waterBrandIdToName[k] === value,
						) ?? "6",
					)
				}
			/>
			<View style={{marginVertical: 20}}>
				<Button
					title={getStr("confirm")}
					onPress={() => {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						if (helper.mocked()) {
							Snackbar.show({
								text: "订水成功！",
								duration: Snackbar.LENGTH_LONG,
							});
						} else {
							postWaterSubmission(
								waterId ?? "",
								String(waterNumber),
								String(ticketNumber),
								brand ?? "6",
								address,
							)
								.then(() => {
									Snackbar.show({
										text: "订水成功！",
										duration: Snackbar.LENGTH_LONG,
									});
								})
								.catch(NetworkRetry);
						}
					}}
					disabled={
						// only fields required by postWaterSubmission need checking
						waterId === undefined ||
						waterId.trim().length === 0 ||
						address.trim().length === 0 ||
						!checkNum(waterNumber) ||
						!checkNum(ticketNumber)
					}
				/>
			</View>
			<Text style={{color: colors.primaryLight}}>作者：</Text>
			<TouchableOpacity
				onPress={() =>
					Linking.openURL("https://github.com/THUzxj").then(() =>
						console.log("Opening THUzxj GitHub page in system explorer"),
					)
				}>
				<Text style={{color: colors.primaryLight}}>THUzxj @ GitHub</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={() =>
					Linking.openURL("https://github.com/t4rf9").then(() =>
						console.log("Opening t4rf9 GitHub page in system explorer"),
					)
				}>
				<Text style={{color: colors.primaryLight}}>t4rf9 @ GitHub</Text>
			</TouchableOpacity>
			<Text style={{marginTop: 8, color: "red"}}>
				{
					"该功能是接入 THUInfo 的新功能，尚未经过充分测试，因此如遇任何问题请及时向我们反馈～"
				}
			</Text>
		</ScrollView>
	);
};

export const WaterScreen = connect(
	(state: State) => ({
		waterId: state.config.waterId,
		waterBrand: state.config.waterBrand ?? "6",
	}),
	(dispatch) => ({
		setWaterId: (id: string) => dispatch(configSet("waterId", id)),
		setWaterBrand: (brand: string) => dispatch(configSet("waterBrand", brand)),
	}),
)(WaterUI);
