import { useEffect, useRef, useState } from "react";
import {
	FlatList,
	Modal,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	StyleSheet,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {useColorScheme} from "react-native";
import {BankPaymentByMonth} from "@thu-info/lib/src/models/home/bank";
import {RoundedView} from "../../components/views";
import IconDropdown from "../../assets/icons/IconDropdown";
import {getStatusBarHeight} from "react-native-safearea-height";
import IconCheck from "../../assets/icons/IconCheck";
import {useHeaderHeight} from "@react-navigation/elements";

export const BankPaymentScreen = () => {
	const [data, setData] = useState<BankPaymentByMonth[]>([]);
	const [refreshing, setRefreshing] = useState(true);
	const [foundation, setFoundation] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	const [loadPartial, setLoadPartial] = useState(true);

	const headerHeight = useHeaderHeight();

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const cancelLastFetch = useRef<() => void | null>();

	const fetchData = () => {
		setRefreshing(true);

		if (cancelLastFetch.current) {
			cancelLastFetch.current();
		}

		let cancelled = false;

		helper
			.getBankPayment(foundation, loadPartial)
			.then((r) => {
				if (cancelled) {
					return;
				}

				setData(r);
				setRefreshing(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				});
				setRefreshing(false);
			});

		cancelLastFetch.current = () => {
			cancelled = true;
		};
	};

	useEffect(fetchData, [foundation, loadPartial]);

	return (
		<View style={{flex: 1}}>
			<View
				style={{
					flexDirection: "row",
					height: 32,
					alignItems: "center",
					backgroundColor: colors.contentBackground,
				}}>
				<TouchableOpacity
					onPress={() => setModalOpen((v) => !v)}
					style={{
						marginLeft: 36,
						flexDirection: "row",
						alignItems: "center",
						flex: 0,
					}}>
					<Text style={{color: modalOpen ? colors.primary : colors.fontB2}}>
						{getStr(foundation ? "bankPaymentFoundation" : "bankPayment")}
					</Text>
					<View style={{marginLeft: 6}}>
						<IconDropdown
							width={6}
							height={4}
							color={modalOpen ? colors.primary : colors.fontB2}
						/>
					</View>
				</TouchableOpacity>
				<Modal visible={modalOpen} transparent>
					<TouchableOpacity
						style={{
							width: "100%",
							height: "100%",
						}}
						onPress={() => setModalOpen(false)}>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.text,
								opacity: 0.3,
								width: "100%",
								top: headerHeight - getStatusBarHeight() + 32,
								bottom: 0,
							}}
						/>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.contentBackground,
								width: "100%",
								top: headerHeight - getStatusBarHeight() + 32,
								borderBottomStartRadius: 12,
								borderBottomEndRadius: 12,
							}}>
							<FlatList
								data={[getStr("bankPayment"), getStr("bankPaymentFoundation")]}
								renderItem={({item, index}) => {
									const showTick =
										(foundation && index === 1) || (!foundation && index === 0);
									return (
										<TouchableOpacity
											onPress={() => {
												setFoundation(index === 1);
												setModalOpen(false);
											}}
											style={{
												paddingHorizontal: 16,
												marginVertical: 8,
												flexDirection: "row",
												justifyContent: "space-between",
											}}>
											<Text style={{color: colors.text, fontSize: 14}}>
												{item}
											</Text>
											{showTick ? <IconCheck height={18} width={18} /> : null}
										</TouchableOpacity>
									);
								}}
								keyExtractor={(item) => item}
							/>
						</View>
					</TouchableOpacity>
				</Modal>
			</View>
			<ScrollView
				style={{flex: 1, margin: 12, marginTop: 4}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchData}
						colors={[colors.accent]}
					/>
				}>
				<View>
					<Text style={{ fontSize: 12, color: colors.fontB2, marginTop: 8, marginStart: 8 }}>
						{loadPartial ? getStr("recentThreeMonths") : getStr("all")}
					</Text>
					{data.length ? data.map(({month, payment}) => (
						<View key={month} style={{marginTop: 12}}>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
								}}>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										color: colors.text,
										marginLeft: 6,
									}}>
									{month}
								</Text>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										color: colors.text,
										marginRight: 16,
									}}>
									￥
									{payment
										.reduce((acc, {total}) => acc + Number(total), 0)
										.toFixed(2)}
								</Text>
							</View>
							<RoundedView style={{marginTop: 8}}>
								{payment.map((item, index) => (
									<View key={item.time}>
										{index > 0 && (
											<View
												style={{
													borderBottomColor: colors.themeGrey,
													borderBottomWidth: StyleSheet.hairlineWidth,
													margin: 12,
												}}
											/>
										)}
										<View style={{flexDirection: "row", marginHorizontal: 16}}>
											<Text
												style={{flex: 3, fontSize: 16, color: colors.text}}
												numberOfLines={2}>
												{item.project}
											</Text>
											<Text
												style={{
													flex: 1,
													fontSize: 16,
													color: colors.text,
													textAlign: "right",
												}}>
												{item.total}
											</Text>
										</View>
										<View
											style={{
												flexDirection: "row",
												marginHorizontal: 16,
												marginTop: 4,
											}}>
											<Text
												style={{flex: 3, fontSize: 14, color: colors.fontB2}}>
												{item.department}
											</Text>
											<Text
												style={{
													flex: 1,
													fontSize: 14,
													color: colors.fontB2,
													textAlign: "right",
												}}>
												{item.usage}
											</Text>
										</View>
										{item.description.length > 0 && (
											<Text
												style={{
													fontSize: 14,
													color: colors.fontB2,
													marginHorizontal: 16,
													marginTop: 4,
												}}>
												{item.description}
											</Text>
										)}
										<Text
											style={{
												fontSize: 14,
												color: colors.fontB2,
												marginHorizontal: 16,
												marginTop: 4,
											}}>
											{item.time}
										</Text>
									</View>
								))}
							</RoundedView>
						</View>
					)) : (
						<RoundedView
							style={{
								marginTop: 12,
								padding: 12,
								alignItems: "center",
						}}>
							<Text
								style={{
									color: colors.fontB2,
									fontSize: 14,
									textAlign: "center",
									marginVertical: 12,
								}}>
							{getStr("noData")}
							</Text>
						</RoundedView>
					)}
				</View>
				<View>
					<Text
						style={{
							color: (refreshing || !loadPartial) ? colors.fontB2 : colors.themeLightPurple,
							fontSize: 12,
							textAlign: "center",
							marginVertical: 12,
						}}
						onPress={() => loadPartial && setLoadPartial(false)}
					>
						{refreshing ? getStr("loading") : loadPartial ? getStr("loadAllData") : getStr("noMoreData")}
					</Text>
				</View>
			</ScrollView>
		</View>
	);
};
