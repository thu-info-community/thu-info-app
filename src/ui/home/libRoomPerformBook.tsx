import React, {useRef, useState} from "react";
import {HomeNav, LibRoomPerformBookProp} from "./homeStack";
import {
	convertUsageToSegments,
	LibRoomBookTimeIndicator,
	timeDiff,
} from "../../components/home/libRoomBookTimeIndicator";
import {
	Alert,
	Button,
	Dimensions,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import {ItemType} from "react-native-dropdown-picker";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {LibFuzzySearchResult} from "thu-info-lib/dist/models/home/library";
import themes from "../../assets/themes/themes";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import ModalDropdown from "react-native-modal-dropdown";

interface ExtendedItemType extends ItemType {
	start: string;
	duration: number;
}

const formatTime = (h: number, m: number) =>
	`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export const LibRoomPerformBookScreen = ({
	route: {
		params: {res, date},
	},
	navigation,
}: {
	route: LibRoomPerformBookProp;
	navigation: HomeNav;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const segments = convertUsageToSegments(res);
	const validBegs = segments
		.filter(([_, duration, occupied]) => duration >= res.minMinute && !occupied)
		.flatMap(([start, duration]) => {
			const startH = Number(start.substring(0, 2));
			const startM = Number(start.substring(3, 5));
			return Array.from(
				new Array(Math.floor((duration - res.minMinute) / 5) + 1),
				(v, k) => {
					let m = startM + k * 5;
					let h = startH + Math.floor(m / 60);
					m -= Math.floor(m / 60) * 60;
					return {
						label: formatTime(h, m),
						value: formatTime(h, m),
						start,
						duration,
					} as ExtendedItemType;
				},
			);
		});

	const genValidEnds = (item: ExtendedItemType, beg: string): ItemType[] => {
		const result: ItemType[] = [];
		const {start, duration} = item;
		let h = Number(beg.substring(0, 2));
		let m = Number(beg.substring(3, 5)) + res.minMinute;
		for (
			let i = 0;
			i < Math.floor((duration - res.minMinute - timeDiff(start, beg)) / 5) + 1;
			i++
		) {
			h += Math.floor(m / 60);
			m -= Math.floor(m / 60) * 60;
			result.push({label: formatTime(h, m), value: formatTime(h, m)});
			m += 5;
		}
		return result;
	};

	const getSubtitle = (title: string, color: string) => {
		return (
			<View
				style={{
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					marginVertical: 8,
				}}>
				<FontAwesome name="chevron-right" color={color} size={18} />
				<Text
					style={{
						fontWeight: "bold",
						fontSize: 18,
						marginHorizontal: 5,
						color: colors.text,
					}}>
					{title}
				</Text>
			</View>
		);
	};

	// TODO: Remember delete them when there are better solutions
	const containerPadding: number = 16;

	// TODO: This function only support 2 pickers in a row. Update later
	const getDatePicker = (
		defaultValue: string,
		items: string[],
		isLeft: boolean, // Whether the picker is on the left of the screen
		text: string,
		onSelect: (value: string) => void,
	) => {
		return (
			<View style={{flex: 1, margin: 4}}>
				<Text style={{marginBottom: 4, color: "gray"}}>{text}</Text>
				<ModalDropdown
					ref={isLeft ? undefined : rightPickerRef}
					options={items}
					defaultValue={defaultValue}
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
					adjustFrame={(val) => {
						return isLeft
							? val
							: {
									...val,
									left:
										(val.right as number) +
										Dimensions.get("window").width / 2 -
										containerPadding,
									right: undefined,
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  };
					}}
					onSelect={(_, value) => onSelect(value)}
				/>
			</View>
		);
	};

	const validEnds =
		validBegs.length > 0 ? genValidEnds(validBegs[0], validBegs[0].start) : [];

	const [begValue, setBegValue] = useState(
		validBegs.length > 0 ? validBegs[0].value ?? null : null,
	);
	const [begItems] = useState(validBegs);
	const [endValue, setEndValue] = useState(
		validEnds.length > 0 ? validEnds[0].value ?? null : null,
	);
	const [endItems, setEndItems] = useState(validEnds);
	const [members, setMembers] = useState<LibFuzzySearchResult[]>([
		{id: helper.userId, label: "自己"},
	]);

	const [userValue, setUserValue] = useState<string | null>(null);
	const [userItems, setUserItems] = useState<ItemType[]>([]);

	const rightPickerRef = useRef<any>();

	console.log(colors.text);

	return (
		<ScrollView style={{padding: containerPadding}}>
			<Text
				style={{
					fontSize: 25,
					marginVertical: 10,
					marginLeft: 10,
					lineHeight: 30,
					alignSelf: "flex-start",
					color: colors.text,
				}}
				numberOfLines={2}>
				{res.roomName}
			</Text>
			{getSubtitle(getStr("occupation"), "red")}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginLeft: 10,
					marginTop: 4,
					alignSelf: "flex-start",
				}}>
				<View
					style={{
						alignItems: "flex-start",
						justifyContent: "center",
					}}>
					<Text style={{marginHorizontal: 8, color: "gray", fontSize: 16}}>
						{getStr("libRoomBookDate")}
					</Text>
				</View>
				<Text
					style={{
						marginHorizontal: 5,
						color: colors.text,
						fontSize: 14,
					}}>
					{date}
				</Text>
			</View>
			<View style={{padding: 20}}>
				<LibRoomBookTimeIndicator res={res} />
			</View>
			{getSubtitle(getStr("libRoomBookInfo"), "green")}
			<View
				style={{
					flexDirection: "row",
					marginVertical: 4,
					alignItems: "center",
				}}>
				<Text style={{margin: 4, fontSize: 16, color: colors.text}}>
					申请时间
				</Text>
			</View>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-around",
					alignItems: "center",
					marginBottom: 8,
				}}>
				{getDatePicker(
					begValue === null ? "选择时间" : (begValue as string),
					begItems.map((val) => val.value) as string[],
					true,
					"开始时间",
					(value) => {
						setBegValue(value);
						const item = validBegs.find((e) => e.value === value);
						if (item === undefined) {
							setEndValue(null);
							setEndItems([]);
						} else {
							const newValidEnds = genValidEnds(item, value as string);
							setEndValue(newValidEnds[0].value ?? null);
							setEndItems(newValidEnds);
						}
						// Adjust the right picker text to default value
						rightPickerRef.current.select(-1);
					},
				)}
				{getDatePicker(
					endValue === null ? "选择时间" : (endValue as string),
					endItems.map((val) => val.value) as string[],
					false,
					"结束时间",
					(value) => setEndValue(value),
				)}
			</View>
			{res.maxUser > 1 && (
				<View>
					<View style={{backgroundColor: "lightgray", height: 1}} />
					<View
						style={{
							flexDirection: "row",
							marginVertical: 8,
							alignItems: "center",
						}}>
						<Text style={{margin: 4, fontSize: 16, color: colors.text}}>
							{getStr("groupMembers")} ({res.minUser}~{res.maxUser})
						</Text>
					</View>
					<Text style={{color: "gray", marginLeft: 4, marginBottom: 8}}>
						{getStr("findUser")}
					</Text>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "center",
							alignItems: "center",
							marginBottom: 12,
						}}>
						<TextInput
							style={{
								backgroundColor: colors.background,
								color: colors.text,
								textAlign: "left",
								borderColor: "lightgrey",
								borderWidth: 1,
								borderRadius: 5,
								padding: 6,
								flex: 1,
								fontSize: 16,
								marginHorizontal: 4,
							}}
							onChangeText={(text) => {
								helper.fuzzySearchLibraryId(text).then((r) => {
									setUserItems(r.map(({id, label}) => ({label, value: id})));
									if (r.length > 0) {
										setUserValue(r[0].id);
									} else {
										setUserValue(null);
									}
								});
							}}
						/>
						<Button
							title={getStr("add")}
							onPress={() => {
								// TODO: Can not handle same names yet.
								const result = userItems.find(({value}) => value === userValue);
								setMembers((prev) => {
									if (
										userValue !== null &&
										result !== undefined &&
										result.label !== undefined &&
										prev.find(({id}) => id === userValue) === undefined
									) {
										return prev.concat({id: userValue, label: result.label});
									} else {
										return prev;
									}
								});
							}}
						/>
					</View>
					<Text style={{color: "gray", marginLeft: 4, marginBottom: 4}}>
						已有研读间使用者（点按可删除）
					</Text>
					<View
						style={{
							marginLeft: 4,
							flexWrap: "wrap",
							flex: 1,
							flexDirection: "row",
							marginBottom: 4,
						}}>
						{members.map(({id, label}) => (
							<TouchableOpacity
								disabled={id === helper.userId}
								onPress={() =>
									Alert.alert(
										`${getStr("delete")} ${label}？`,
										undefined,
										[
											{text: getStr("cancel")},
											{
												text: getStr("confirm"),
												onPress: () =>
													setMembers((prev) =>
														prev.filter((it) => it.id !== id),
													),
											},
										],
										{cancelable: true},
									)
								}
								key={id}
								style={{
									backgroundColor:
										colors.text === "#000000" ? "white" : "black",
									borderColor: "lightgray",
									borderRadius: 5,
									borderWidth: 1,
									paddingHorizontal: 4,
									margin: 4,
								}}>
								<View style={{flexDirection: "row", paddingVertical: 8}}>
									<Text style={{color: "gray"}}>{label}</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</View>
			)}
			<View style={{alignSelf: "center"}}>
				<Button
					title={getStr("confirm")}
					onPress={() => {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						helper
							.bookLibraryRoom(
								res,
								`${date} ${begValue}`,
								`${date} ${endValue}`,
								res.maxUser > 1 ? members.map((it) => it.id) : [],
							)
							.then(({success, msg}) => {
								Snackbar.show({text: msg, duration: Snackbar.LENGTH_LONG});
								if (success) {
									Alert.alert(getStr("warning"), getStr("libRoomFirstTime"));
									navigation.pop();
								}
							})
							.catch(NetworkRetry);
					}}
					disabled={
						begValue === null ||
						endValue === null ||
						members.length > res.maxUser ||
						members.length < res.minUser
					}
				/>
			</View>
		</ScrollView>
	);
};
