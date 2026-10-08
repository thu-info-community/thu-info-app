import {useEffect, useState} from "react";
import {
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {Snackbar} from "react-native-snackbar";
import {Feedback} from "@thu-info/lib/src/models/app/feedback";
import {LibError} from "@thu-info/lib/src/utils/error";
import {helper} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import {formatTimestamp} from "../../utils/time";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import {
	EmptyState,
	ErrorState,
	LoadingState,
	Separator,
} from "../../components/subpage/rows";
import {SectionCard} from "../../components/subpage/containers";
import {PrimaryButton} from "../../components/subpage/buttons";
import {layout, spacing} from "../../components/subpage/tokens";
import IconRight from "../../assets/icons/IconRight";
import {RootNav} from "../../components/Root";

const QuestionCard = ({feedback}: {feedback: Feedback}) => {
	const {colors} = themes(useColorScheme());
	const [expanded, setExpanded] = useState(false);

	const {content, reply, replierName, repliedTime} = feedback;
	const hasReply = reply.trim().length > 0;
	const attribution = [replierName, formatTimestamp(repliedTime)]
		.filter((s) => !!s)
		.join(" · ");

	const statusText = hasReply
		? attribution.length > 0
			? `${getStr("popiAnswered")} · ${attribution}`
			: getStr("popiAnswered")
		: getStr("popiPending");

	return (
		<RoundedView style={{padding: spacing.lg, marginBottom: layout.sectionGap}}>
			<TouchableOpacity
				accessibilityRole="button"
				accessibilityState={{expanded}}
				accessibilityLabel={content}
				onPress={() => setExpanded((value) => !value)}
				style={{flexDirection: "row", alignItems: "flex-start"}}>
				<View style={{flex: 1, marginRight: spacing.sm}}>
					<Text
						numberOfLines={expanded ? 0 : 2}
						style={{
							color: colors.text,
							fontSize: 16,
							fontWeight: "600",
							lineHeight: 22,
						}}>
						{content}
					</Text>
					<Text
						style={{
							color: reply ? colors.fontB3 : colors.fontB2,
							fontSize: 13,
							marginTop: spacing.xs,
						}}>
						{statusText}
					</Text>
				</View>
				<View
					style={{
						paddingVertical: spacing.xs,
						transform: [{rotate: expanded ? "270deg" : "90deg"}],
					}}>
					<IconRight width={20} height={20} />
				</View>
			</TouchableOpacity>
			{expanded ? (
				<>
					<Separator style={{marginHorizontal: 0}} />
					<Text
						style={{
							color: colors.fontB2,
							fontSize: 13,
							marginBottom: spacing.xs,
						}}>
						{getStr("popiAnswer")}
					</Text>
					<Text
						selectable
						style={{color: colors.text, fontSize: 16, lineHeight: 24}}>
						{hasReply ? reply : "—"}
					</Text>
				</>
			) : null}
		</RoundedView>
	);
};

export const PopiScreen = ({navigation}: {navigation: RootNav}) => {
	const {colors} = themes(useColorScheme());

	const [data, setData] = useState<Feedback[]>([]);
	const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
	const [refreshing, setRefreshing] = useState(false);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getFeedbackReplies()
			.then((replies) => {
				setData(replies);
				setPhase("ready");
			})
			.catch((e) => {
				if (e instanceof LibError && e.message) {
					Snackbar.show({
						text: e.message,
						duration: Snackbar.LENGTH_SHORT,
					});
				} else {
					Snackbar.show({
						text: getStr("networkRetry"),
						duration: Snackbar.LENGTH_SHORT,
					});
				}
				// Only surface the error screen if we have nothing to show;
				// a failed refresh keeps the previously loaded list.
				setPhase((prev) => (prev === "ready" ? prev : "error"));
			})
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, []);

	return (
		<ScrollView
			testID="popi-list"
			style={{flex: 1, backgroundColor: colors.themeBackground}}
			contentContainerStyle={{padding: spacing.md}}
			refreshControl={
				<ThemedRefreshControl refreshing={refreshing} onRefresh={refresh} />
			}>
			<SectionCard title={getStr("askBox")}>
				<Text style={{color: colors.fontB2, fontSize: 13, lineHeight: 18}}>
					{getStr("popiIntro")}
				</Text>
				<PrimaryButton
					text={getStr("popiAsk")}
					onPress={() => navigation.navigate("HelpAndFeedback")}
					style={{marginTop: spacing.md}}
				/>
			</SectionCard>
			{phase === "loading" ? (
				<LoadingState />
			) : phase === "error" ? (
				<ErrorState onRetry={refresh} />
			) : data.length === 0 ? (
				<EmptyState
					title={getStr("popiEmpty")}
					hint={getStr("popiEmptyHint")}
				/>
			) : (
				data.map((item, index) => (
					<QuestionCard
						key={`${index}:${item.content.slice(0, 32)}`}
						feedback={item}
					/>
				))
			)}
		</ScrollView>
	);
};
