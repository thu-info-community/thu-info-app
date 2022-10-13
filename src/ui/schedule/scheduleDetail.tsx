/* eslint-disable no-mixed-spaces-and-tabs */
import {View, Text, TouchableOpacity, Modal} from "react-native";
import React, {useState} from "react";
import {Choice, scheduleDelOrHide} from "src/redux/slices/schedule";
import {useDispatch} from "react-redux";
import {ScheduleType} from "thu-info-lib/dist/models/schedule/schedule";
import {getStr} from "src/utils/i18n";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {RootNav, ScheduleDetailRouteProp} from "../../components/Root";
import IconTime from "../../assets/icons/IconTime";
import IconBoard from "../../assets/icons/IconBoard";
import IconTrademark from "../../assets/icons/IconTrademark";

export const beginTime = [
	"",
	"08:00",
	"08:50",
	"09:50",
	"10:40",
	"11:30",
	"13:30",
	"14:20",
	"15:20",
	"16:10",
	"17:05",
	"17:55",
	"19:20",
	"20:10",
	"21:00",
];

export const endTime = [
	"",
	"08:45",
	"09:35",
	"10:35",
	"11:25",
	"12:15",
	"14:15",
	"15:05",
	"16:05",
	"16:55",
	"17:50",
	"18:40",
	"20:05",
	"20:55",
	"21:45",
];

const nullAlias = (str: string) => {
	if (str === undefined) {
		return true;
	}
	return str.length === 0;
};

export interface ScheduleDetailProps {
	name: string;
	location: string;
	week: number;
	dayOfWeek: number;
	begin: number | string;
	end: number | string;
	alias: string;
	type: ScheduleType;
}

export const ScheduleDetailScreen = ({
	navigation,
	route,
}: {
	navigation: RootNav;
	route: ScheduleDetailRouteProp;
}) => {
	const props = route.params;
	const [delPopupShow, setDelPopupShow] = useState<boolean>(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const dispatch = useDispatch();

	const delButton = (choice: Choice) => {
		if (props.type === ScheduleType.EXAM) {
			return null;
		}
		const verbText: string =
			props.type === ScheduleType.CUSTOM && choice === Choice.ALL
				? getStr("delSchedule")
				: getStr("hideSchedule");
		const buttonText: string =
			choice === Choice.ALL
				? verbText + getStr("allTime")
				: choice === Choice.REPEAT
				? verbText + getStr("repeatly")
				: verbText + getStr("once");
		return (
			<TouchableOpacity
				onPress={() => {
					setDelPopupShow(false);
					dispatch(
						scheduleDelOrHide([
							props.name,
							{
								activeWeeks: [props.week],
								dayOfWeek: props.dayOfWeek,
								// @ts-ignore
								begin: props.begin,
								// @ts-ignore
								end: props.end,
							},
							choice,
						]),
					);
					navigation.pop();
				}}>
				<Text
					style={{
						textAlign: "center",
						fontSize: 20,
						color: colors.text,
					}}>
					{buttonText}
				</Text>
			</TouchableOpacity>
		);
	};

	return (
		<RoundedView
			style={{margin: 8, paddingHorizontal: 16, paddingVertical: 8, flex: 1}}>
			<Text
				style={{
					fontSize: 20,
					lineHeight: 28,
					color: colors.fontB1,
					fontWeight: "bold",
				}}
				numberOfLines={2}>
				{(nullAlias(props.alias) ? props.name : props.alias).substring(
					props.type === ScheduleType.CUSTOM ? 6 : 0,
				)}
			</Text>
			<Text style={{fontSize: 14, color: colors.themePurple}}>
				{props.location === "" ? getStr("locationUnset") : props.location}
			</Text>
			<View style={{flexDirection: "row", marginTop: 22, alignItems: "center"}}>
				<IconTime height={15} width={15} />
				<Text style={{marginLeft: 12, color: colors.fontB2, fontSize: 14}}>
					{getStr("dayOfWeek")[props.dayOfWeek]}
					{props.type === ScheduleType.EXAM
						? (getStr("mark") === "CH" ? "（" : "(") +
						  props.begin +
						  " ~ " +
						  props.end +
						  (getStr("mark") === "CH" ? "）" : ")")
						: getStr("periodNumPrefix") +
						  props.begin +
						  (props.begin === props.end ? "" : " ~ " + props.end) +
						  getStr("periodNumSuffix") +
						  (getStr("mark") === "CH" ? "（" : "(") +
						  // @ts-ignore
						  beginTime[props.begin] +
						  " ~ " +
						  // @ts-ignore
						  endTime[props.end] +
						  (getStr("mark") === "CH" ? "）" : ")")}
				</Text>
			</View>
			<View style={{flexDirection: "row", marginTop: 5, alignItems: "center"}}>
				<IconBoard height={15} width={15} />
				<Text style={{marginLeft: 12, color: colors.fontB2, fontSize: 14}}>
					{getStr("weekNumPrefix") + props.week + getStr("weekNumSuffix")}
				</Text>
			</View>
			{nullAlias(props.alias) ? null : (
				<View
					style={{flexDirection: "row", marginTop: 5, alignItems: "center"}}>
					<IconTrademark height={15} width={15} />
					<Text style={{marginLeft: 12, color: colors.fontB2, fontSize: 14}}>
						{props.name}（{getStr("originalName")}）
					</Text>
				</View>
			)}
			<View
				style={{
					backgroundColor: colors.themeGrey,
					height: 1,
					marginTop: 12,
				}}
			/>
			<View style={{flex: 1}} />
			<TouchableOpacity
				onPress={() => setDelPopupShow(true)}
				style={{
					alignSelf: "stretch",
					justifyContent: "center",
					alignItems: "center",
					margin: 12,
					padding: 12,
				}}>
				<Text style={{color: colors.statusError, fontSize: 20}}>
					{getStr("hideScheduleText")}
				</Text>
			</TouchableOpacity>
			<Modal visible={delPopupShow} transparent>
				<TouchableOpacity
					onPress={() => setDelPopupShow(false)}
					style={{
						width: "100%",
						height: "100%",
						justifyContent: "flex-end",
					}}>
					<View
						style={{
							position: "absolute",
							backgroundColor: colors.fontB1,
							opacity: 0.1,
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
						}}
					/>
					<RoundedView
						style={{marginHorizontal: 7, backgroundColor: "#FFFFFF55"}}>
						<Text
							style={{
								color: colors.text,
								fontWeight: "600",
								fontSize: 13,
								textAlign: "center",
								marginTop: 13,
							}}>
							{getStr("hideScheduleConfirmationText")}
						</Text>
						<View
							style={{
								height: 1,
								backgroundColor: "#00000033",
								marginVertical: 15,
							}}
						/>
						{delButton(Choice.ONCE)}
						<View
							style={{
								height: 1,
								backgroundColor: "#00000033",
								marginVertical: 15,
							}}
						/>
						{delButton(Choice.REPEAT)}
						<View
							style={{
								height: 1,
								backgroundColor: "#00000033",
								marginVertical: 15,
							}}
						/>
						{delButton(Choice.ALL)}
					</RoundedView>
					<TouchableOpacity
						onPress={() => setDelPopupShow(false)}
						style={{margin: 7}}>
						<RoundedView style={{padding: 16, alignItems: "center"}}>
							<Text
								style={{
									color: colors.statusWarning,
									fontWeight: "bold",
									fontSize: 20,
								}}>
								{getStr("cancel")}
							</Text>
						</RoundedView>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</RoundedView>
	);
};
