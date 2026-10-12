import {TouchableOpacity, View} from "react-native";
import {TimeSlice} from "@thu-info/lib/src/models/schedule/schedule";
import md5 from "md5";
import {StoredSchedule} from "../../redux/scheduleData";
import {
	ScheduleLayout,
	ScheduleLayoutBlock,
	scheduleRowAt,
	scheduleAddTime,
} from "../../utils/scheduleLayout";
import {ScheduleEditParams} from "./scheduleAdd";
import {ScheduleBlock, ScheduleGridLines} from "./schedule";

export interface ScheduleOccurrence {
	type: "normal";
	slice: TimeSlice;
	schedule: StoredSchedule;
	week: number;
}

export interface NewScheduleDefaults {
	week: number;
	dayOfWeek: number;
	periodBegin: number;
	periodEnd: number;
	dateIndex: number;
	beginHour: number;
	beginMinute: number;
	endHour: number;
	endMinute: number;
	useCustomDateTime: boolean;
}

interface CourseProps {
	unitWidth: number;
	shortenMap: Record<string, string | undefined>;
	colorList: string[];
	enableNewUI?: boolean;
	onOpen: (params: ScheduleEditParams) => void;
	onAction: (params: ScheduleEditParams) => void;
}

const ScheduleCourseBlock = ({
	block,
	unitWidth,
	shortenMap,
	colorList,
	enableNewUI,
	onOpen,
	onAction,
}: CourseProps & {block: ScheduleLayoutBlock<ScheduleOccurrence>}) => {
	const {slice, schedule, week} = block.entry;
	const color =
		colorList[parseInt(md5(schedule.name).substr(0, 6), 16) % colorList.length];
	const params: ScheduleEditParams = {
		localId: schedule.localId,
		id: slice.id,
		name: schedule.name,
		location: schedule.location,
		week,
		dayOfWeek: slice.dayOfWeek,
		beginTime: slice.beginTime,
		endTime: slice.endTime,
		alias: shortenMap[schedule.localId] ?? "",
		type: schedule.type,
		category: schedule.category,
	};
	return (
		<ScheduleBlock
			dayOfWeek={slice.dayOfWeek}
			top={block.top}
			height={block.height}
			name={shortenMap[schedule.localId] ?? schedule.name}
			location={schedule.location}
			timeLabel={block.timeLabel}
			compact={block.compact}
			gridWidth={unitWidth}
			blockColor={`${color}${enableNewUI ? "44" : ""}`}
			textColor={enableNewUI ? color : "white"}
			onPress={() => onOpen(params)}
			onLongPress={() => onAction(params)}
		/>
	);
};

export const ScheduleWeekPage = ({
	layout,
	index,
	gridWidth,
	dayCount,
	onAddDefaults,
	onAdd,
	...courseProps
}: CourseProps & {
	layout: ScheduleLayout<ScheduleOccurrence>;
	index: number;
	gridWidth: number;
	dayCount: number;
	onAddDefaults: (defaults: NewScheduleDefaults) => void;
	onAdd: () => void;
}) => (
	<View
		testID={`schedule-page-${index}`}
		style={{height: layout.height, width: gridWidth}}>
		<View style={{height: layout.height, width: gridWidth}}>
			<ScheduleGridLines rows={layout.rows} />
			<TouchableOpacity
				testID={`schedule-add-${index}`}
				activeOpacity={1}
				style={{position: "absolute", left: 0, right: 0, top: 0, bottom: 0}}
				onPressIn={({nativeEvent: {locationX, locationY}}) => {
					const dayIndex = Math.max(
						0,
						Math.min(
							dayCount - 1,
							Math.floor(locationX / courseProps.unitWidth),
						),
					);
					const row = scheduleRowAt(layout.rows, locationY);
					if (!row) {
						return;
					}
					const defaults = scheduleAddTime(row, locationY);
					const week = index + 1;
					const dayOfWeek = dayIndex + 1;
					onAddDefaults({
						week,
						dayOfWeek,
						periodBegin: defaults.periodBegin,
						periodEnd: defaults.periodEnd,
						dateIndex: (week - 1) * 7 + dayOfWeek - 1,
						beginHour: Math.floor(defaults.begin / 60),
						beginMinute: defaults.begin % 60,
						endHour: Math.floor(defaults.end / 60),
						endMinute: defaults.end % 60,
						useCustomDateTime: defaults.custom,
					});
				}}
				onPress={onAdd}
			/>
			{layout.blocks.map((block, blockIndex) => (
				<ScheduleCourseBlock
					key={`${block.entry.schedule.name}-${block.entry.week}-${block.entry.slice.dayOfWeek}-${block.entry.slice.beginTime.valueOf()}-${blockIndex}`}
					block={block}
					{...courseProps}
				/>
			))}
		</View>
	</View>
);
