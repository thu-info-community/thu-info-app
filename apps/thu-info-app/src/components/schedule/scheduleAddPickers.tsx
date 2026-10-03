import {Dispatch, SetStateAction} from "react";
import {Switch, Text, TouchableOpacity, View} from "react-native";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import dayjs from "dayjs";
import IconRight from "../../assets/icons/IconRight";
import IconSelected from "../../assets/icons/IconSelected";
import IconNotSelected from "../../assets/icons/IconNotSelected";
import {getStr} from "../../utils/i18n";
import {explainPeriod, explainWeekList} from "../../utils/calendar";
import {beginTime, endTime} from "../../utils/scheduleLayout";
import {FlexGrid} from "../FlexGrid";
import {BottomPopupTriggerView} from "../views";
import {ScheduleFormColors} from "./scheduleAddForm";

type ColoredProps = {colors: ScheduleFormColors};

const ScheduleFieldSummary = ({
	colors,
	label,
	value,
	valueColor = colors.formText,
}: ColoredProps & {
	label: string;
	value: string;
	valueColor?: string;
}) => (
	<View style={{flexDirection: "row", alignItems: "center"}}>
		<Text style={{color: colors.formText, fontSize: 16, flex: 0}}>{label}</Text>
		<View style={{flex: 1}} />
		<Text style={{color: valueColor, fontSize: 16, flex: 0}} numberOfLines={1}>
			{value}
		</Text>
		<IconRight height={24} width={24} />
	</View>
);

const SchedulePickerWheel = ({
	colors,
	data,
	index,
	onChange,
	textColor = colors.formText,
}: ColoredProps & {
	data: string[];
	index: number;
	onChange: (index: number) => void;
	textColor?: string;
}) => (
	<ScrollPicker
		style={{flex: 1}}
		dataSource={data}
		selectedIndex={index}
		renderItem={(item, itemIndex) => (
			<Text
				style={{color: textColor, fontSize: 20}}
				key={`${item}-${itemIndex}`}>
				{item}
			</Text>
		)}
		onValueChange={(_, selectedIndex) => onChange(selectedIndex)}
		wrapperHeight={200}
		wrapperBackground={colors.contentBackground}
		itemHeight={48}
		highlightColor={colors.themeGrey}
		highlightBorderWidth={1}
	/>
);

const WeekPreset = ({
	colors,
	label,
	selected,
	onPress,
}: ColoredProps & {
	label: string;
	selected: boolean;
	onPress: () => void;
}) => (
	<TouchableOpacity
		onPress={onPress}
		style={{
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			marginHorizontal: 16,
		}}>
		{selected ? (
			<IconSelected height={16} width={16} />
		) : (
			<IconNotSelected height={16} width={16} />
		)}
		<Text style={{color: colors.formText, fontSize: 14, marginLeft: 8}}>
			{label}
		</Text>
	</TouchableOpacity>
);

const WeekPicker = ({
	colors,
	count,
	weeks,
	onChange,
}: ColoredProps & {
	count: number;
	weeks: number[];
	onChange: Dispatch<SetStateAction<number[]>>;
}) => {
	const allWeeks = Array.from({length: count}, (_, k) => k + 1);
	const presets = [
		{
			label: getStr("oddWeeks"),
			weeks: allWeeks.filter((week) => week % 2 === 1),
		},
		{
			label: getStr("evenWeeks"),
			weeks: allWeeks.filter((week) => week % 2 === 0),
		},
		{label: getStr("allWeeks"), weeks: allWeeks},
		{label: getStr("noWeek"), weeks: []},
	];
	const sortedWeeks = String([...weeks].sort((a, b) => a - b));
	return (
		<View>
			<View style={{marginHorizontal: 12, marginTop: 7}}>
				<FlexGrid>
					{allWeeks.map((week) => (
						<TouchableOpacity
							key={week}
							style={{
								marginVertical: 4,
								alignItems: "center",
								backgroundColor: weeks.includes(week)
									? colors.themePurple
									: undefined,
								borderRadius: 8,
							}}
							onPress={() =>
								onChange((current) =>
									current.includes(week)
										? current.filter((w) => w !== week)
										: [...current, week],
								)
							}>
							<Text
								style={{
									color: weeks.includes(week) ? "white" : colors.formText,
									fontSize: 18,
									lineHeight: 40,
								}}>
								{week}
							</Text>
						</TouchableOpacity>
					))}
				</FlexGrid>
			</View>
			<View
				style={{
					height: 1,
					backgroundColor: colors.themeGrey,
					marginTop: 14,
					marginBottom: 28,
				}}
			/>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 32,
				}}>
				{presets.map((preset) => (
					<WeekPreset
						key={preset.label}
						colors={colors}
						label={preset.label}
						selected={sortedWeeks === String(preset.weeks)}
						onPress={() => onChange(preset.weeks)}
					/>
				))}
			</View>
		</View>
	);
};

export const ScheduleWeekField = ({
	colors,
	value,
	draft,
	count,
	onDraftChange,
	onConfirm,
}: ColoredProps & {
	value: number[];
	draft: number[];
	count: number;
	onDraftChange: Dispatch<SetStateAction<number[]>>;
	onConfirm: () => void;
}) => (
	<BottomPopupTriggerView
		popupTitle={explainWeekList(draft)}
		popupCancelable
		popupCanFulfill={draft.length > 0}
		popupOnFulfilled={onConfirm}
		popupOnCancelled={() => {}}
		popupContent={
			<WeekPicker
				colors={colors}
				count={count}
				weeks={draft}
				onChange={onDraftChange}
			/>
		}>
		<ScheduleFieldSummary
			colors={colors}
			label={getStr("weeks")}
			value={explainWeekList(value)}
		/>
	</BottomPopupTriggerView>
);

interface FieldProps<T> extends ColoredProps {
	value: T;
	draft: T;
	onDraftChange: (draft: T) => void;
	onConfirm: () => void;
}

interface PeriodSelection {
	day: number;
	begin: number;
	end: number;
}

const PeriodPicker = ({
	colors,
	draft,
	onDraftChange,
}: Omit<FieldProps<PeriodSelection>, "value" | "onConfirm">) => (
	<View style={{flexDirection: "row"}}>
		<SchedulePickerWheel
			colors={colors}
			data={Array.from({length: 7}, (_, k) => getStr("dayOfWeek")[k + 1])}
			index={draft.day - 1}
			onChange={(index) => onDraftChange({...draft, day: index + 1})}
		/>
		<SchedulePickerWheel
			colors={colors}
			data={Array.from({length: 14}, (_, k) => beginTime[k + 1])}
			index={draft.begin - 1}
			onChange={(index) => onDraftChange({...draft, begin: index + 1})}
		/>
		<SchedulePickerWheel
			colors={colors}
			data={Array.from(
				{length: 15 - draft.begin},
				(_, k) => endTime[k + draft.begin],
			)}
			index={draft.end - draft.begin}
			onChange={(index) => onDraftChange({...draft, end: index + draft.begin})}
		/>
	</View>
);

export const SchedulePeriodField = ({
	colors,
	value,
	draft,
	onDraftChange,
	onConfirm,
}: FieldProps<PeriodSelection>) => (
	<BottomPopupTriggerView
		popupTitle={`${getStr("dayOfWeek")[draft.day]} ${beginTime[draft.begin]} - ${endTime[draft.end]}`}
		popupCancelable
		popupCanFulfill={draft.begin <= draft.end}
		popupOnFulfilled={onConfirm}
		popupOnCancelled={() => {}}
		popupContent={
			<PeriodPicker
				colors={colors}
				draft={draft}
				onDraftChange={onDraftChange}
			/>
		}>
		<ScheduleFieldSummary
			colors={colors}
			label={getStr("periods")}
			value={explainPeriod(value.day, value.begin, value.end)}
		/>
	</BottomPopupTriggerView>
);

const formatDate = (firstDay: string, index: number) => {
	const date = dayjs(firstDay).add(index, "day").startOf("day");
	const day = date.day() === 0 ? 7 : date.day();
	return `${date.format("YYYY-MM-DD")} ${getStr("dayOfWeek")[day]}`;
};

export const ScheduleDateField = ({
	colors,
	value,
	draft,
	onDraftChange,
	onConfirm,
	firstDay,
	totalDays,
}: FieldProps<number> & {
	firstDay: string;
	totalDays: number;
}) => (
	<BottomPopupTriggerView
		popupTitle={totalDays > 0 ? formatDate(firstDay, draft) : ""}
		popupCancelable
		popupCanFulfill={totalDays > 0}
		popupOnFulfilled={onConfirm}
		popupOnCancelled={() => {}}
		popupContent={
			<View style={{flexDirection: "row"}}>
				<SchedulePickerWheel
					colors={colors}
					data={Array.from({length: totalDays}, (_, k) =>
						formatDate(firstDay, k),
					)}
					index={draft}
					onChange={onDraftChange}
				/>
			</View>
		}>
		<ScheduleFieldSummary
			colors={colors}
			label={getStr("scheduleDate")}
			value={totalDays > 0 ? formatDate(firstDay, value) : ""}
		/>
	</BottomPopupTriggerView>
);

interface TimeSelection {
	beginHour: number;
	beginMinute: number;
	endHour: number;
	endMinute: number;
}

const formatTime = (hour: number, minute: number) =>
	`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
const formatTimeRange = (time: TimeSelection) =>
	`${formatTime(time.beginHour, time.beginMinute)} - ${formatTime(time.endHour, time.endMinute)}`;

const TimePicker = ({
	colors,
	draft,
	onDraftChange,
}: Omit<FieldProps<TimeSelection>, "value" | "onConfirm">) => (
	<View style={{flexDirection: "row"}}>
		{(["beginHour", "beginMinute", "endHour", "endMinute"] as const).map(
			(field) => (
				<SchedulePickerWheel
					key={field}
					colors={colors}
					textColor={colors.fontB1}
					data={Array.from({length: field.endsWith("Hour") ? 24 : 60}, (_, k) =>
						String(k).padStart(2, "0"),
					)}
					index={draft[field]}
					onChange={(index) => onDraftChange({...draft, [field]: index})}
				/>
			),
		)}
	</View>
);

export const ScheduleTimeRangeField = ({
	colors,
	value,
	draft,
	onDraftChange,
	onConfirm,
}: FieldProps<TimeSelection>) => (
	<BottomPopupTriggerView
		popupTitle={formatTimeRange(draft)}
		popupCancelable
		popupCanFulfill
		popupOnFulfilled={onConfirm}
		popupOnCancelled={() => {}}
		popupContent={
			<TimePicker colors={colors} draft={draft} onDraftChange={onDraftChange} />
		}>
		<ScheduleFieldSummary
			colors={colors}
			label={getStr("scheduleTimeRange")}
			value={formatTimeRange(value)}
			valueColor={colors.fontB2}
		/>
	</BottomPopupTriggerView>
);

export const ScheduleRepeatField = ({
	colors,
	value,
	onChange,
}: ColoredProps & {
	value: boolean;
	onChange: (value: boolean) => void;
}) => (
	<View style={{flexDirection: "row", alignItems: "center"}}>
		<Text style={{color: colors.formText, fontSize: 16, flex: 1}}>
			{getStr("scheduleRepeatWeekly")}
		</Text>
		<Switch
			ios_backgroundColor={colors.inputBorder}
			value={value}
			onValueChange={onChange}
			trackColor={{false: colors.inputBorder, true: colors.themePurple}}
			thumbColor={colors.themeLightGrey}
		/>
	</View>
);
