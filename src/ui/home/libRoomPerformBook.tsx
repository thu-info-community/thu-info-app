import React, {useState} from "react";
import {HomeNav, LibRoomPerformBookProp} from "./homeStack";
import {
	convertUsageToSegments,
	LibRoomBookTimeIndicator,
	timeDiff,
} from "../../components/home/libRoomBookTimeIndicator";
import {
	Alert,
	Button,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import DropDownPicker, {ItemType} from "react-native-dropdown-picker";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {LibFuzzySearchResult} from "thu-info-lib/dist/models/home/library";
import themes from "../../assets/themes/themes";

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
	const validEnds =
		validBegs.length > 0 ? genValidEnds(validBegs[0], validBegs[0].start) : [];

	const [begOpen, setBegOpen] = useState(false);
	const [begValue, setBegValue] = useState(
		validBegs.length > 0 ? validBegs[0].value ?? null : null,
	);
	const [begItems, setBegItems] = useState(validBegs);
	const [endOpen, setEndOpen] = useState(false);
	const [endValue, setEndValue] = useState(
		validEnds.length > 0 ? validEnds[0].value ?? null : null,
	);
	const [endItems, setEndItems] = useState(validEnds);
	const [members, setMembers] = useState<LibFuzzySearchResult[]>([
		{id: helper.userId, label: "自己"},
	]);

	const [userOpen, setUserOpen] = useState(false);
	const [userValue, setUserValue] = useState<string | null>(null);
	const [userItems, setUserItems] = useState<ItemType[]>([]);

	return (
		<ScrollView style={{padding: 18}}>
			<View style={{padding: 20}}>
				<LibRoomBookTimeIndicator res={res} />
			</View>
			<Text style={{padding: 12, color: colors.text}}>
				{getStr("libRoomBookInfo")} {res.roomName}
			</Text>
			<Text style={{padding: 12, color: colors.text}}>
				{getStr("libRoomBookDate")} {date}
			</Text>
			<View style={{padding: 12, flexDirection: "row"}}>
				<View style={{flex: 1}}>
					<Text style={{color: colors.text}}>
						{getStr("libRoomBookTimeStart")}{" "}
					</Text>
					<DropDownPicker
						open={begOpen}
						value={begValue}
						items={begItems}
						setOpen={setBegOpen}
						setValue={setBegValue}
						setItems={setBegItems}
						style={{width: 200}}
						onOpen={() => {
							setEndOpen(false);
							setUserOpen(false);
						}}
						onChangeValue={(value) => {
							const item = validBegs.find((e) => e.value === value);
							if (item === undefined) {
								setEndValue(null);
								setEndItems([]);
							} else {
								const newValidEnds = genValidEnds(item, value as string);
								setEndValue(newValidEnds[0].value ?? null);
								setEndItems(newValidEnds);
							}
						}}
					/>
				</View>
				<View style={{flex: 1}}>
					<Text style={{color: colors.text}}>
						{getStr("libRoomBookTimeEnd")}{" "}
					</Text>
					<DropDownPicker
						open={endOpen}
						value={endValue}
						items={endItems}
						setOpen={setEndOpen}
						setValue={setEndValue}
						setItems={setEndItems}
						style={{width: 200}}
						onOpen={() => {
							setBegOpen(false);
							setUserOpen(false);
						}}
					/>
				</View>
			</View>
			{res.maxUser > 1 && (
				<View style={{padding: 12}}>
					<Text style={{color: colors.text}}>
						{getStr("groupMembers")} ({res.minUser}~{res.maxUser})
					</Text>
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
												setMembers((prev) => prev.filter((it) => it.id !== id)),
										},
									],
									{cancelable: true},
								)
							}
							key={id}>
							<View style={{flexDirection: "row", paddingVertical: 8}}>
								<Text style={{color: colors.text}}>{label}</Text>
							</View>
						</TouchableOpacity>
					))}
					<Text style={{color: colors.text}}>{getStr("findUser")}</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<TextInput
							style={{
								backgroundColor: colors.background,
								color: colors.text,
								textAlign: "left",
								borderColor: "lightgrey",
								borderWidth: 1,
								borderRadius: 5,
								marginTop: 5,
								flex: 1,
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
						<View style={{flex: 1}}>
							<DropDownPicker
								open={userOpen}
								value={userValue}
								items={userItems}
								setOpen={setUserOpen}
								setValue={setUserValue}
								setItems={setUserItems}
								onOpen={() => {
									setBegOpen(false);
									setEndOpen(false);
								}}
							/>
						</View>
						<Button
							title={getStr("add")}
							onPress={() => {
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
