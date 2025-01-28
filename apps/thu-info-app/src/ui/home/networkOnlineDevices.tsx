import { useEffect, useState } from "react";
import { Device } from "@thu-info/lib/src/models/network/device";
import { helper } from "../../redux/store";
import Snackbar from "react-native-snackbar";
import { getStr } from "../../utils/i18n";
import { GestureHandlerRootView, RefreshControl, ScrollView } from "react-native-gesture-handler";
import {
	KeyboardAvoidingView,
	// Platform,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import themes from "../../assets/themes/themes";
import { RoundedView } from "../../components/views";
import { useHeaderHeight } from "@react-navigation/elements";
import { styles } from "../settings/settings";
import { UseregAuthError } from "@thu-info/lib/src/utils/error.ts";
import { NetworkRetry } from "../../components/easySnackbars.ts";
import { RootNav } from "../../components/Root.tsx";

const DeviceCard = ({ device, refresh }: { device: Device; refresh: Function }) => {
	const themeName = useColorScheme();
	const { colors } = themes(themeName);

	const Item = ({ left, right }: { left: string; right: string }) => {
		return (
			<View
				style={{
					marginTop: 4,
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

	return (
		<RoundedView style={{ margin: 8, borderRadius: 16 + 12 }}>
			<View style={{ marginHorizontal: 16 }}>
				<Text style={{ fontSize: 16, marginVertical: 2, color: colors.text, fontWeight: "bold" }}>
					{device.ip4}
				</Text>
				<View
					style={{
						...styles(themeName).separator,
						marginHorizontal: 0,
					}}
				/>
				<Item left={getStr("ip6")} right={device.ip6} />
				<Item left={getStr("loggedAt")} right={device.loggedAt} />
				<Item left={getStr("mac")} right={device.mac} />
				<Item
					left={getStr("authType")}
					right={device.authPermission}
				/>
				<RoundedView
					style={{
						backgroundColor: colors.statusWarningOpacity,
						marginTop: 12,
						paddingVertical: 8,
						borderRadius: 12,
					}}>
					<TouchableOpacity
						onPress={() => {
							helper
								.logoutNetworkDevice(device)
								.catch((e) => {
									Snackbar.show({
										text: getStr("networkRetry") + e?.message,
										duration: Snackbar.LENGTH_SHORT,
									});
								})
								.then(() => {
									refresh();
								});
						}}>
						<Text
							style={{
								textAlign: "center",
								fontSize: 16,
								color: colors.statusError,
							}}>
							{getStr("logoutNetworkDevice")}
						</Text>
					</TouchableOpacity>
				</RoundedView>
			</View>
		</RoundedView>
	);
};

export const NetworkOnlineDevicesScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const { colors } = themes(themeName);

	const [devices, setDevices] = useState<Device[]>([]);

	const [refreshing, setRefreshing] = useState(false);

	const [internetAccess, setInternetAccess] = useState(true);

	const [importIp, setImportIp] = useState("");

	const headerHeight = useHeaderHeight();

	const refresh = () => {
		helper
			.getOnlineDevices()
			.then(setDevices)
			.catch((e) => {
				if (e instanceof UseregAuthError) {
					navigation.navigate("NetworkLogin");
				} else {
					NetworkRetry(e);
				}
			})
			.then(() => setRefreshing(false));
	};
	useEffect(refresh, [navigation]);
	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			// behavior={Platform.OS === "ios" ? "padding" : "height"}
			behavior="padding"
			keyboardVerticalOffset={headerHeight}>
			<GestureHandlerRootView style={{ flex: 1, flexDirection: "column" }}>
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={refresh}
							colors={[colors.accent]}
							progressBackgroundColor={colors.contentBackground}
						/>
					}
					contentContainerStyle={{ padding: 8 }}
				>
					{devices.length > 0 ? (
						devices.map((d) => (
							<DeviceCard
								refresh={refresh}
								device={d}
								key={d.ip4}
							/>
						))
					) : (
						<Text
							style={{
								textAlign: "center",
								marginTop: 24,
								color: colors.text,
							}}>
							{getStr("noOnlineDevice")}
						</Text>
					)}
				</ScrollView>
				<View
					style={{
						flexDirection: "row",
						backgroundColor: colors.contentBackground,
						columnGap: 16,
					}}>
					<View style={{ flex: 1, flexDirection: "row", paddingStart: 16 }}>
						<Text
							style={{
								verticalAlign: "middle",
								color: colors.text,
							}}>
							{getStr("ipAddr")}
						</Text>
						<TextInput
							style={{
								flex: 1,
								color: colors.text,
								fontSize: 14,
								paddingHorizontal: 16,
							}}
							onChangeText={setImportIp}
							placeholder={"1.2.3.4"}
							placeholderTextColor={colors.fontB2}
						/>
					</View>
					<View style={{ flexDirection: "row" }}>
						<Text
							style={{
								verticalAlign: "middle",
								color: colors.text,
							}}>
							{getStr("internetAccess")}
						</Text>
						<Switch
							value={internetAccess}
							onValueChange={setInternetAccess}
							thumbColor={internetAccess ? colors.themeDarkPurple : colors.themeDarkGrey}
							trackColor={{ true: colors.themePurple }}
						/>
					</View>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							padding: 4,
							backgroundColor: colors.themePurple,
						}}>
						<TouchableOpacity
							style={{
								padding: 8,
							}}
							onPress={() => {
								if (importIp === "") {
									Snackbar.show({
										text: getStr("ipAddrEmpty"),
										duration: Snackbar.LENGTH_SHORT,
									});
									return;
								}

								helper
									.loginNetworkDevice(importIp, internetAccess)
									.then((s) => {
										Snackbar.show({
											text: getStr("importSuccess") + " " + s,
											duration: Snackbar.LENGTH_SHORT,
										});
									})
									.then(refresh)
									.catch((e) => {
										let message = e?.message;

										if (message === "ip_already_online_error") {
											message = getStr("importAlreadyOnline");
										} else if (!/E\d+:/g.test(message)) {
											message = getStr("networkRetry") + message;
										}

										Snackbar.show({
											text: message,
											duration: Snackbar.LENGTH_SHORT,
										});
									});
							}}>
							<Text style={{ color: "white", fontSize: 14 }}>
								{getStr("proxyImport")}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</GestureHandlerRootView>
		</KeyboardAvoidingView>
	);
};
