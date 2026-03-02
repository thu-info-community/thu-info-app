import dayjs from "dayjs";
import {View, Text, TouchableOpacity, Modal} from "react-native";
import {useLayoutEffect, useState} from "react";
import {Choice, scheduleDelOrHide} from "../../redux/slices/schedule";
import {useDispatch, useSelector} from "react-redux";
import {ScheduleType, Schedule} from "@thu-info/lib/src/models/schedule/schedule";
import {getStr} from "../../utils/i18n";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {RootNav, ScheduleDetailRouteProp} from "../../components/Root";
import IconTime from "../../assets/icons/IconTime";
import IconBoard from "../../assets/icons/IconBoard";
import IconTrademark from "../../assets/icons/IconTrademark";
import {styles} from "../settings/settings";
import {ScheduleAddModal} from "../../components/schedule/scheduleAdd";
import {helper, State} from "../../redux/store";

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
	beginTime: dayjs.Dayjs;
	endTime: dayjs.Dayjs;
	alias: string;
	type: ScheduleType;
	activeWeeks?: number[];
	category?: string;
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
	const [editPopupShow, setEditPopupShow] = useState<boolean>(false);
	const [deleting, setDeleting] = useState<boolean>(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const dispatch = useDispatch();
	const {baseSchedule} = useSelector((s: State) => s.schedule);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: getStr("scheduleDetail"),
			headerRight: () => (
				<TouchableOpacity
					style={{paddingHorizontal: 16, margin: 4}}
					onPress={() => setEditPopupShow(true)}>
					<Text style={{color: colors.themePurple, fontSize: 16}}>
						{getStr("edit")}
					</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, colors.themePurple]);

	const isCustomLike =
		props.type === ScheduleType.CUSTOM || props.category === "个人日历";

	const buildSchedulesForDeletion = (
		target: ScheduleDetailProps,
		choice: Choice,
		base: Schedule[],
	): Schedule[] => {
		const matchedSchedule = base.find(
			(s) =>
				s.name === target.name &&
				s.location === target.location &&
				s.type === target.type &&
				(target.category === undefined || s.category === target.category),
		);

		if (!matchedSchedule) {
			return [];
		}

		if (choice === Choice.ALL) {
			return [matchedSchedule];
		}

		if (choice === Choice.ONCE) {
			const matchedSlice = matchedSchedule.activeTime.base.find(
				(slice) =>
					slice.dayOfWeek === target.dayOfWeek &&
					slice.beginTime.isSame(target.beginTime, "minute") &&
					slice.endTime.isSame(target.endTime, "minute"),
			);

			if (!matchedSlice) {
				return [];
			}

			return [
				{
					...matchedSchedule,
					activeTime: {base: [matchedSlice]},
					delOrHideTime: {base: []},
				},
			];
		}

		return [];
	};

	const delButton = (choice: Choice) => {
		if (props.type === ScheduleType.EXAM) {
			return null;
		}
		const verbText: string =
			isCustomLike
				? getStr("delSchedule")
				: getStr("hideSchedule");
		const buttonText: string =
			choice === Choice.ALL
				? verbText + getStr("allTime")
				: choice === Choice.REPEAT
				? verbText + getStr("repeatly")
				: verbText + getStr("weekNumPrefix") + props.week + getStr("weekNumSuffix") + getStr("once");
		const showLoading = deleting && isCustomLike;
		return (
			<TouchableOpacity
				disabled={deleting}
				onPress={async () => {
					if (deleting) {
						return;
					}
					try {
						if (isCustomLike) {
							setDeleting(true);
							const schedulesToDelete = buildSchedulesForDeletion(
								props,
								choice,
								baseSchedule,
							);
							if (schedulesToDelete.length > 0) {
								await helper.deleteCustomSchedule(schedulesToDelete);
							}
						}
						setDelPopupShow(false);
						dispatch(
							scheduleDelOrHide([
								props.name,
								{
									dayOfWeek: props.dayOfWeek,
									beginTime: props.beginTime,
									endTime: props.endTime,
								},
								choice,
							]),
						);
						navigation.pop();
					} finally {
						setDeleting(false);
					}
				}}>
				<Text
					style={{
						textAlign: "center",
						fontSize: 20,
						color: colors.statusWarning,
					}}>
					{showLoading ? getStr("loading") : buttonText}
				</Text>
			</TouchableOpacity>
		);
	};

	const separatorView = (thick: boolean = false) => (
		<View
			style={[
				styles(themeName).separator,
				{ marginHorizontal: 0 },
				thick ? { borderBottomWidth: 1 } : {},
			]}
		/>
	);

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
				{nullAlias(props.alias)
					? props.name.substring(props.type === ScheduleType.CUSTOM ? 6 : 0)
					: props.alias}
			</Text>
			<Text style={{fontSize: 14, color: colors.themePurple}}>
				{props.location === "" ? getStr("locationUnset") : props.location}
			</Text>
			<View style={{flexDirection: "row", marginTop: 22, alignItems: "center"}}>
				<IconTime height={15} width={15} />
				<Text style={{marginLeft: 12, color: colors.fontB2, fontSize: 14}}>
					{getStr("dayOfWeek")[props.dayOfWeek]}
					{(getStr("mark") === "CH" ? "（" : "(") +
						  props.beginTime.format("HH:mm") +
						  " ~ " +
						  props.endTime.format("HH:mm") +
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
						{props.name.substring(props.type === ScheduleType.CUSTOM ? 6 : 0)}
						{getStr("lp")}
						{getStr("originalName")}
						{getStr("rp")}
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
			<ScheduleAddModal
				visible={editPopupShow}
				onClose={() => setEditPopupShow(false)}
				initialParams={props}
			/>
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
						style={{marginHorizontal: 7, backgroundColor: colors.contentBackground}}>
						<Text
							style={{
								color: colors.text,
								fontWeight: "600",
								fontSize: 14,
								textAlign: "center",
							}}>
							{getStr("hideScheduleConfirmationText")}
						</Text>
						{separatorView(true)}
						{delButton(Choice.ONCE)}
						{!isCustomLike && (
							<>
								{separatorView()}
								{delButton(Choice.REPEAT)}
							</>
						)}
						{separatorView()}
						{delButton(Choice.ALL)}
					</RoundedView>
					<TouchableOpacity
						onPress={() => setDelPopupShow(false)}
						style={{margin: 8}}>
						<RoundedView style={{padding: 16, alignItems: "center"}}>
							<Text
								style={{
									color: colors.text,
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
