import React, {useState} from "react";
import {HomeNav, LibRoomPerformBookProp} from "./homeStack";
import {
	convertUsageToSegments,
	LibRoomBookTimeIndicator,
	timeDiff,
} from "../../components/home/libRoomBookTimeIndicator";
import {Button, Text, View} from "react-native";
import {getStr} from "../../utils/i18n";
import DropDownPicker, {ItemType} from "react-native-dropdown-picker";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";

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

	return (
		<View style={{padding: 18}}>
			<View style={{padding: 20}}>
				<LibRoomBookTimeIndicator res={res} />
			</View>
			<Text style={{padding: 12}}>
				{getStr("libRoomBookInfo")} {res.roomName}
			</Text>
			<Text style={{padding: 12}}>
				{getStr("libRoomBookDate")} {date}
			</Text>
			<View style={{padding: 12, flexDirection: "row"}}>
				<View style={{flex: 1}}>
					<Text>{getStr("libRoomBookTimeStart")} </Text>
					<DropDownPicker
						open={begOpen}
						value={begValue}
						items={begItems}
						setOpen={setBegOpen}
						setValue={setBegValue}
						setItems={setBegItems}
						style={{width: 200}}
						onOpen={() => setEndOpen(false)}
						onChangeValue={(value) => {
							const item = validBegs.find((e) => e.value === value);
							if (item === undefined) {
								setEndValue(null);
								setEndItems([]);
							} else {
								console.log(value);
								const newValidEnds = genValidEnds(item, value as string);
								setEndValue(newValidEnds[0].value ?? null);
								setEndItems(newValidEnds);
							}
						}}
					/>
				</View>
				<View style={{flex: 1}}>
					<Text>{getStr("libRoomBookTimeEnd")} </Text>
					<DropDownPicker
						open={endOpen}
						value={endValue}
						items={endItems}
						setOpen={setEndOpen}
						setValue={setEndValue}
						setItems={setEndItems}
						style={{width: 200}}
						onOpen={() => setBegOpen(false)}
					/>
				</View>
			</View>
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
							)
							.then(({success, msg}) => {
								Snackbar.show({text: msg, duration: Snackbar.LENGTH_LONG});
								if (success) {
									navigation.pop();
								}
							})
							.catch(NetworkRetry);
					}}
					disabled={begValue === null || endValue === null}
				/>
			</View>
		</View>
	);
};
