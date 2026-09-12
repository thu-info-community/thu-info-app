import {
	Switch,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import {State} from "../../redux/store";
import {configSet} from "../../redux/slices/config";
import {getStr} from "../../utils/i18n";
import {
	beginTime,
	endTime,
	formatScheduleMinute,
	ScheduleRow,
} from "../../utils/scheduleLayout";

interface ScheduleBlockProps {
	dayOfWeek: number;
	top: number;
	height: number;
	name: string;
	location: string;
	gridWidth: number;
	onPress: () => void;
	onLongPress?: () => void;
	textColor?: string;
	blockColor?: string;
	blockMargin?: number;
	timeLabel?: string;
	compact?: boolean;
}

export const ScheduleBlock = (props: ScheduleBlockProps) => {
	const {colors} = themes(useColorScheme());
	const textColor = props.textColor || "white";
	const margin = props.blockMargin ?? 2;
	const height = Math.max(1, props.height - margin * 2);
	return (
		<TouchableOpacity
			accessibilityRole="button"
			accessibilityLabel={[props.name, props.timeLabel, props.location]
				.filter(Boolean)
				.join(", ")}
			style={{
				position: "absolute",
				left: (props.dayOfWeek - 1) * props.gridWidth + margin,
				top: props.top + margin,
				width: props.gridWidth - margin * 2,
				height,
				backgroundColor: props.blockColor || colors.themePurple,
				borderRadius: 4,
				paddingVertical: props.compact ? 2 : props.timeLabel ? 4 : 6,
				paddingHorizontal: 4,
				overflow: "hidden",
				zIndex: props.compact ? 1 : 0,
			}}
			onPress={props.onPress}
			onLongPress={props.onLongPress}>
			<Text
				numberOfLines={props.compact || props.timeLabel ? 1 : undefined}
				style={{
					flexShrink: 1,
					minHeight: 0,
					color: textColor,
					lineHeight: 18,
					fontWeight: "bold",
					fontSize: 13,
				}}>
				{props.name}
			</Text>
			{!props.compact && props.timeLabel && (
				<Text
					numberOfLines={props.gridWidth < 64 ? 2 : 1}
					style={{color: textColor, fontSize: 9, lineHeight: 12}}>
					{props.gridWidth < 64
						? props.timeLabel.replace("–", "\n")
						: props.timeLabel}
				</Text>
			)}
			{!props.compact && props.location.length > 0 && (
				<Text
					numberOfLines={props.timeLabel ? 1 : 3}
					style={{
						color: textColor,
						fontSize: 8,
						lineHeight: 10,
						flexShrink: 0,
						maxHeight: Math.max(0, height - 30),
					}}>
					{"@" + props.location}
				</Text>
			)}
		</TouchableOpacity>
	);
};

export const SchedulePeriodSwitch = ({notice = false}: {notice?: boolean}) => {
	const {colors} = themes(useColorScheme());
	const enabled =
		useSelector((s: State) => s.config.scheduleUseClassPeriods) ?? true;
	const dispatch = useDispatch();
	return (
		<View style={{backgroundColor: colors.contentBackground}}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: 16,
					paddingVertical: 8,
				}}>
				<Text style={{color: colors.fontB1, fontSize: 16, flex: 1}}>
					{getStr("scheduleUseClassPeriods")}
				</Text>
				<Switch
					accessibilityLabel={getStr("scheduleUseClassPeriods")}
					ios_backgroundColor={colors.inputBorder}
					thumbColor={colors.themeLightGrey}
					trackColor={{false: colors.inputBorder, true: colors.themePurple}}
					value={enabled}
					onValueChange={(value) => {
						dispatch(configSet({key: "scheduleUseClassPeriods", value}));
					}}
				/>
			</View>
			{notice && (
				<Text
					style={{
						marginHorizontal: 16,
						marginTop: 8,
						color: colors.fontB3,
						fontSize: 12,
					}}>
					{getStr("scheduleClassPeriodsNotice")}
				</Text>
			)}
		</View>
	);
};

export const ScheduleTimeAxis = ({
	rows,
	height,
	classPeriods,
	heightMode,
}: {
	rows: ScheduleRow[];
	height: number;
	classPeriods: boolean;
	heightMode: number;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View testID="schedule-time-axis" style={{width: 48, height}}>
			{rows
				.filter((row) => row.height > 0)
				.map((row) => (
					<View
						key={`${row.kind}-${row.begin}`}
						style={{
							position: "absolute",
							top: row.top,
							height: row.height,
							width: 40,
							alignItems: "center",
							justifyContent: classPeriods ? "center" : "flex-start",
						}}>
						<Text
							style={{
								color: colors.fontB1,
								fontSize: row.kind === "period" ? 12 : 9,
								marginTop: classPeriods ? 0 : -6,
							}}>
							{row.kind === "period"
								? row.period
								: formatScheduleMinute(row.begin)}
						</Text>
						{classPeriods && (heightMode > 1 || row.kind === "gap") && (
							<>
								{row.kind === "period" && (
									<Text
										style={{color: colors.fontB2, fontSize: 8, marginTop: 4}}>
										{formatScheduleMinute(row.begin)}
									</Text>
								)}
								<Text style={{color: colors.fontB2, fontSize: 8}}>
									{formatScheduleMinute(row.end)}
								</Text>
							</>
						)}
					</View>
				))}
			{!classPeriods && (
				<>
					<Text
						style={{
							position: "absolute",
							top: height - 6,
							width: 40,
							textAlign: "center",
							color: colors.fontB1,
							fontSize: 9,
						}}>
						24:00
					</Text>
					<View
						style={{
							position: "absolute",
							left: 44,
							top: 0,
							bottom: 0,
							width: 1,
							backgroundColor: colors.inputBorder,
						}}
					/>
					{[...beginTime, ...endTime].filter(Boolean).map((time, index) => {
						const [h, m] = time.split(":").map(Number);
						const start = rows[0]?.begin ?? 480;
						const y = ((h * 60 + m - start) * height) / (1440 - start);
						return y < 0 ? null : (
							<View
								key={index}
								style={{
									position: "absolute",
									left: 41,
									top: y - 3,
									width: 6,
									height: 6,
									borderRadius: 3,
									borderWidth: 1,
									borderColor: colors.inputBorder,
									backgroundColor: colors.contentBackground,
								}}
							/>
						);
					})}
				</>
			)}
		</View>
	);
};

export const ScheduleGridLines = ({rows}: {rows: ScheduleRow[]}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View
			pointerEvents="none"
			style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0}}>
			{rows
				.filter(
					(row) =>
						row.kind === "hour" ||
						(row.kind === "gap" &&
							(row.height > 0 || row.begin === 735 || row.begin === 1120)),
				)
				.map((row) => (
					<View
						key={`${row.kind}-${row.begin}`}
						style={{position: "absolute", top: row.top, left: 0, right: 0}}>
						<View style={{height: 1, backgroundColor: colors.inputBorder}} />
						{row.kind === "gap" &&
							(row.begin === 735 || row.begin === 1120) && (
								<Text
									style={{
										position: "absolute",
										right: 8,
										top: 1,
										fontSize: 9,
										color: colors.fontB3,
									}}>
									{getStr(row.begin === 735 ? "lunch" : "supper")}
								</Text>
							)}
					</View>
				))}
		</View>
	);
};
