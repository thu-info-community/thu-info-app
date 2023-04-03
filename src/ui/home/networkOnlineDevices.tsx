import {useEffect, useState} from "react";
import {Device} from "thu-info-lib/dist/models/network/device";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {RefreshControl, ScrollView} from "react-native-gesture-handler";
import {Text, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";

const DeviceCard = ({device}: {device: Device}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const Item = ({left, right}: {left: string; right: string}) => {
		return (
			<View
				style={{
					marginTop: 2,
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View
					style={{
						flex: 1,
						alignItems: "flex-start",
					}}>
					<Text
						style={{
							color: colors.text,
						}}>
						{left}
					</Text>
				</View>
				<View
					style={{
						flex: 2,
						alignItems: "flex-end",
					}}>
					<Text
						style={{
							color: colors.text,
						}}>
						{right}
					</Text>
				</View>
			</View>
		);
	};

	// TODO: Force logout.
	return (
		<RoundedView style={{margin: 12}}>
			<View style={{marginHorizontal: 16}}>
				<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
					{device.ip4}
				</Text>
				<View
					style={{
						borderWidth: 0.4,
						marginVertical: 12,
						borderColor: colors.themeGrey,
					}}
				/>
				<Item left={getStr("ip6")} right={device.ip6} />
				<Item left={getStr("nasIP")} right={device.nasIp} />
				<Item left={getStr("loggedAt")} right={device.loggedAt} />
				<Item left={getStr("in")} right={device.in} />
				<Item left={getStr("out")} right={device.out} />
				<Item left={getStr("mac")} right={device.mac} />
				<Item
					left={getStr("authType")}
					right={getStr(device.authType === "802.1x" ? "_8021x" : "import")}
				/>
			</View>
		</RoundedView>
	);
};

export const NetworkOnlineDevicesScreen = () => {
	// TODO
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [devices, setDevices] = useState<Device[]>([]);

	const [refreshing, setRefreshing] = useState(false);

	const refresh = () => {
		helper
			.getOnlineDevices()
			.then(setDevices)
			.catch((e) => {
				Snackbar.show({
					text: getStr("networkRetry") + e?.message,
					duration: Snackbar.LENGTH_SHORT,
				});
			})
			.then(() => setRefreshing(false));
	};
	useEffect(refresh, []);
	return (
		<ScrollView
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}>
			{devices.map((d) => (
				<DeviceCard device={d} />
			))}
		</ScrollView>
	);
};
