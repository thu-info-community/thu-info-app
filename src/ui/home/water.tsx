import {useEffect, useState} from "react";
import {
	Linking,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {
	waterBrandIdToName,
	getWaterUserInformation,
	postWaterSubmission,
} from "../../network/water";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import themes from "../../assets/themes/themes";
import {connect} from "react-redux";
import {helper, State} from "../../redux/store";
import {configSet} from "../../redux/actions/config";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {
	QzyqSelectProp,
	RootNav,
	WaterSelectTicketNumberProp,
} from "../../components/Root";
import {styles} from "../settings/settings";
import IconCheck from "../../assets/icons/IconCheck";

export interface QzyqSelectParams {
	ticketNumber: number;
}

const WaterUI = ({
	waterId,
	waterBrand,
	setWaterId,
	navigation,
	route: {params},
}: {
	waterId: string | undefined;
	waterBrand: string;
	setWaterId: (id: string) => void;
	navigation: RootNav;
	route: QzyqSelectProp;
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const {colors} = theme;

	const [correspondent, setCorrespondent] = useState("");
	const [address, setAddress] = useState("");
	const [waterNumber, setWaterNumber] = useState(1);

	const load = () => {
		if (waterId !== undefined) {
			getWaterUserInformation(waterId).then((r) => {
				setCorrespondent(r.name ?? "");
				setAddress(r.address ?? "");
			});
		}
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(load, []);

	const submissionDisabled =
		waterId === undefined ||
		waterId.trim().length === 0 ||
		address.trim().length === 0;

	return (
		<ScrollView style={{flex: 1, paddingHorizontal: 12, paddingVertical: 16}}>
			<RoundedView style={{padding: 16}}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text
						style={{
							color: colors.text,
							fontSize: 16,
							lineHeight: 24,
						}}>
						档案号
					</Text>
					<TextInput
						style={{
							backgroundColor: colors.contentBackground,
							color: colors.fontB3,
							textAlign: "right",
							fontSize: 16,
							lineHeight: 24,
							padding: 0,
						}}
						value={waterId ?? ""}
						onChangeText={setWaterId}
						onEndEditing={load}
						placeholder="请输入"
					/>
				</View>
				<View
					style={{
						borderWidth: 0.4,
						borderColor: colors.themeGrey,
						marginVertical: 12,
					}}
				/>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text
						style={{
							color: colors.text,
							fontSize: 16,
							lineHeight: 24,
						}}>
						联系人
					</Text>
					<Text
						style={{
							color: colors.fontB3,
							fontSize: 16,
							lineHeight: 24,
						}}>
						{correspondent}
					</Text>
				</View>
				<View
					style={{
						borderWidth: 0.4,
						borderColor: colors.themeGrey,
						marginVertical: 12,
					}}
				/>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text
						style={{
							color: colors.text,
							fontSize: 16,
							lineHeight: 24,
						}}>
						送水地址
					</Text>
					<Text
						style={{
							color: colors.fontB3,
							fontSize: 16,
							lineHeight: 24,
						}}>
						{address}
					</Text>
				</View>
			</RoundedView>
			<RoundedView style={{padding: 16, marginTop: 16}}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text
						style={{
							color: colors.text,
							fontSize: 16,
							lineHeight: 24,
						}}>
						订水量
					</Text>
					<View
						style={{
							borderRadius: 4,
							borderWidth: 1,
							borderColor: colors.themeGrey,
							flexDirection: "row",
						}}>
						<TouchableOpacity
							disabled={waterNumber <= 0}
							onPress={() => setWaterNumber((v) => v - 1)}>
							<Text
								style={{
									color: waterNumber <= 0 ? colors.fontB3 : colors.text,
									width: 24,
									height: 24,
									textAlign: "center",
									textAlignVertical: "center",
									fontSize: 16,
								}}>
								-
							</Text>
						</TouchableOpacity>
						<View style={{width: 1, backgroundColor: colors.themeGrey}} />
						<Text
							style={{
								color: colors.text,
								width: 40,
								height: 24,
								textAlign: "center",
								textAlignVertical: "center",
								fontSize: 16,
							}}>
							{waterNumber}
						</Text>
						<View style={{width: 1, backgroundColor: colors.themeGrey}} />
						<TouchableOpacity onPress={() => setWaterNumber((v) => v + 1)}>
							<Text
								style={{
									color: colors.text,
									width: 24,
									height: 24,
									textAlign: "center",
									textAlignVertical: "center",
									fontSize: 16,
								}}>
								+
							</Text>
						</TouchableOpacity>
					</View>
				</View>
				<View
					style={{
						borderWidth: 0.4,
						borderColor: colors.themeGrey,
						marginVertical: 12,
					}}
				/>
				<TouchableOpacity
					onPress={() => navigation.navigate("WaterSelectBrand")}
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text
						style={{
							color: colors.text,
							fontSize: 16,
							lineHeight: 24,
						}}>
						订水品牌
					</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{waterBrandIdToName[waterBrand]}
						</Text>
						<IconRight height={24} width={24} />
					</View>
				</TouchableOpacity>
				<View
					style={{
						borderWidth: 0.4,
						borderColor: colors.themeGrey,
						marginVertical: 12,
					}}
				/>
				<TouchableOpacity
					onPress={() => navigation.navigate("WaterSelectTicketNumber", params)}
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text
						style={{
							color: colors.text,
							fontSize: 16,
							lineHeight: 24,
						}}>
						订水票量
					</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text
							style={{
								color: colors.fontB3,
								fontSize: 16,
								lineHeight: 24,
							}}>
							{params.ticketNumber} 张
						</Text>
						<IconRight height={24} width={24} />
					</View>
				</TouchableOpacity>
			</RoundedView>
			<View
				style={{
					marginTop: 40,
					flexDirection: "row",
					justifyContent: "flex-end",
				}}>
				<TouchableOpacity
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
								String(params.ticketNumber),
								waterBrand ?? "6",
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
					disabled={submissionDisabled}
					style={{
						backgroundColor: submissionDisabled
							? colors.themeGrey
							: colors.primaryLight,
						paddingVertical: 8,
						paddingHorizontal: 16,
						borderRadius: 4,
					}}>
					<Text style={{color: colors.contentBackground, fontSize: 20}}>
						{getStr("submitOrder")}
					</Text>
				</TouchableOpacity>
			</View>
			<View style={{margin: 16, marginTop: 39}}>
				<Text style={{color: colors.fontB3}}>
					初次使用或订水票用完，请拨打商家联系电话：
					<Text style={{textDecorationLine: "underline"}}>62781118</Text> 、
					<Text style={{textDecorationLine: "underline"}}>62773725</Text>
				</Text>
				<Text />
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
				<Text />
				<Text style={{color: colors.fontB3}}>
					本功能是接入 THU Info
					的开源第三方功能，尚未经过充分测试，如遇任何问题请随时向我们反馈。
				</Text>
			</View>
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
	}),
)(WaterUI);

const WaterSelectBrandUI = ({
	waterBrand,
	setWaterBrand,
	navigation,
}: {
	waterBrand: string;
	setWaterBrand: (brand: string) => void;
	navigation: RootNav;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				{Object.values(waterBrandIdToName).map((brandName, index) => (
					<View key={brandName}>
						{index > 0 && <View style={style.separator} />}
						<TouchableOpacity
							style={style.touchable}
							onPress={() => {
								setWaterBrand(
									Object.keys(waterBrandIdToName).find(
										(k) => waterBrandIdToName[k] === brandName,
									) ?? "6",
								);
								navigation.pop();
							}}>
							<Text style={style.text}>{brandName}</Text>
							{waterBrandIdToName[waterBrand] === brandName && (
								<IconCheck width={18} height={18} />
							)}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</View>
	);
};

export const WaterSelectBrandScreen = connect(
	(state: State) => ({
		waterBrand: state.config.waterBrand ?? "6",
	}),
	(dispatch) => ({
		setWaterBrand: (brand: string) => dispatch(configSet("waterBrand", brand)),
	}),
)(WaterSelectBrandUI);

export const WaterSelectTicketNumberScreen = ({
	navigation,
	route: {
		params: {ticketNumber},
	},
}: {
	navigation: RootNav;
	route: WaterSelectTicketNumberProp;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				{[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((number, index) => (
					<View key={number}>
						{index > 0 && <View style={style.separator} />}
						<TouchableOpacity
							style={style.touchable}
							onPress={() =>
								navigation.navigate("Qzyq", {ticketNumber: number})
							}>
							<Text style={style.text}>{number} 张</Text>
							{number === ticketNumber && <IconCheck width={18} height={18} />}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</View>
	);
};
