import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {ScheduleSyncReceiving, ScheduleSyncSending} from "../../utils/webApi";
import {currState, store} from "../../redux/store";
import React, {useRef, useState} from "react";
import {scheduleSyncAction} from "../../redux/actions/schedule";
import {NetworkRetry} from "../../components/easySnackbars";
import themedStyles from "../../utils/themedStyles";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";

const styles = themedStyles((theme) => ({
	title: {
		margin: 10,
		textAlign: "left",
		fontSize: 30,
		fontWeight: "bold",
		color: theme.colors.text,
	},
	caption: {
		marginHorizontal: 10,
		marginBottom: 5,
		textAlign: "left",
		color: theme.colors.text,
	},
	warningCaption: {
		marginHorizontal: 10,
		marginVertical: 5,
		textAlign: "left",
		color: "red",
	},
	tokenStyle: {
		margin: 10,
		textAlign: "center",
		fontSize: 60,
		fontWeight: "bold",
		fontFamily: "monospace",
		color: theme.colors.text,
	},
	buttonStyle: {
		marginHorizontal: 10,
		marginVertical: 5,
		height: 40,
		backgroundColor: theme.colors.accent,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
	},
	secondaryButtonStyle: {
		marginHorizontal: 10,
		marginVertical: 5,
		height: 40,
		backgroundColor: theme.colors.themeDarkGrey,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
	},
	buttonTextStyle: {
		color: "white",
		fontWeight: "bold",
	},
}));

type InitialStage = {
	state: "initial";
};
type WaitOtherStage = {
	state: "waitOther";
};
type ToConfirmStage = {
	state: "toConfirm";
	token: string;
};
type WaitSyncStage = {
	state: "waitSync";
};
type DoneStage = {
	state: "done";
};
/// Type-safe state machine for schedule synchronization.
type ScheduleSyncStage =
	| InitialStage
	| WaitOtherStage
	| ToConfirmStage
	| WaitSyncStage
	| DoneStage;

function ProgressIndicator(props: {stage: ScheduleSyncStage}) {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const {stage} = props;
	let count = 0;
	const total = 5;
	switch (stage.state) {
		case "initial":
			count = 1;
			break;
		case "waitOther":
			count = 2;
			break;
		case "toConfirm":
			count = 3;
			break;
		case "waitSync":
			count = 4;
			break;
		case "done":
			count = 5;
			break;
	}
	return (
		<View
			style={{
				flexDirection: "row",
				height: 10,
			}}>
			{[...Array(total)].map((_, i) => (
				<View
					key={i}
					style={{
						flex: 1,
						backgroundColor:
							i < count ? theme.colors.primary : theme.colors.primaryLight,
					}}
				/>
			))}
		</View>
	);
}

export function ScheduleSyncScreen(props: any) {
	// this should not be used directly, as it is type-unsafe
	const isSending: boolean = props.route.params.isSending;

	const [state, setState] = useState<ScheduleSyncStage>({state: "initial"});

	const themeName = useColorScheme();
	const style = styles(themeName);

	const client = useRef<ScheduleSyncSending | ScheduleSyncReceiving | null>(
		null,
	);
	if (!client.current) {
		const userId = currState().auth.userId;
		client.current = isSending
			? new ScheduleSyncSending(userId)
			: new ScheduleSyncReceiving(userId);
	}
	const currentClient: ScheduleSyncSending | ScheduleSyncReceiving =
		client.current!;
	// use currentClient.kind to type-safely determine whether it is sending or receiving

	function CancelButton() {
		return (
			<TouchableOpacity
				style={style.secondaryButtonStyle}
				onPress={async () => {
					await currentClient.stop();
					setState({state: "initial"});
				}}>
				<Text style={style.buttonTextStyle}>{getStr("cancel")}</Text>
			</TouchableOpacity>
		);
	}

	return (
		<>
			<ProgressIndicator stage={state} />
			<View style={{padding: 5, flex: 0}}>
				<Text style={style.title}>
					{((): string => {
						switch (state.state) {
							case "initial":
								switch (currentClient.kind) {
									case "send":
										return getStr("sendSchedule");
									case "receive":
										return getStr("receiveSchedule");
								}
								break;
							case "waitOther":
								return getStr("matching");
							case "toConfirm":
								return getStr("confirmSync");
							case "waitSync":
								return getStr("syncing");
							case "done":
								return getStr("done");
						}
					})()}
				</Text>
				<Text style={style.caption}>
					{((): string => {
						switch (state.state) {
							case "initial":
								switch (currentClient.kind) {
									case "send":
										return getStr("syncSendInitialCaption");
									case "receive":
										return getStr("syncReceiveInitialCaption");
								}
								break;
							case "waitOther":
								switch (currentClient.kind) {
									case "send":
										return getStr("syncSendWaitOtherCaption");
									case "receive":
										return getStr("syncReceiveWaitOtherCaption");
								}
								break;
							case "toConfirm":
								return getStr("syncToConfirmCaption").format(state.token);
							case "waitSync":
								return getStr("syncWaitSyncCaption");
							case "done":
								return getStr("syncDoneCaption");
						}
					})()}
				</Text>
			</View>
			<View
				style={{
					flex: 1,
					justifyContent: "center",
				}}>
				{state.state === "toConfirm" && (
					<Text style={style.tokenStyle}>{state.token}</Text>
				)}
			</View>
			<View
				style={{
					paddingHorizontal: 5,
					paddingVertical: 10,
					flex: 1,
					justifyContent: "flex-end",
				}}>
				{(() => {
					switch (state.state) {
						case "initial":
							return (
								<>
									{(() => {
										switch (currentClient.kind) {
											case "send":
												return <></>;
											case "receive":
												return (
													<Text style={style.warningCaption}>
														{getStr("syncReceiveWarning")}
													</Text>
												);
										}
									})()}
									<TouchableOpacity
										style={style.buttonStyle}
										onPress={async () => {
											try {
												setState({state: "waitOther"});
												await currentClient.start((token: string) => {
													setState({state: "toConfirm", token});
												});
											} catch {
												setState({state: "initial"});
												NetworkRetry();
											}
										}}>
										<Text style={style.buttonTextStyle}>{getStr("start")}</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={style.secondaryButtonStyle}
										onPress={() => props.navigation.pop()}>
										<Text style={style.buttonTextStyle}>
											{getStr("return")}
										</Text>
									</TouchableOpacity>
								</>
							);
						case "waitOther":
							return <CancelButton />;
						case "toConfirm":
							return (
								<>
									<TouchableOpacity
										style={style.buttonStyle}
										onPress={async () => {
											setState({state: "waitSync"});
											try {
												switch (currentClient.kind) {
													case "send":
														await currentClient.confirmAndSend(
															JSON.stringify(currState().schedule),
															() => {
																setState({state: "done"});
															},
														);
														break;
													case "receive":
														await currentClient.confirmAndReceive(
															(json: string) => {
																store.dispatch(
																	scheduleSyncAction(JSON.parse(json)),
																);
																setState({state: "done"});
															},
														);
														break;
												}
											} catch {
												setState({state: "initial"});
												NetworkRetry();
											}
										}}>
										<Text style={style.buttonTextStyle}>{getStr("sync")}</Text>
									</TouchableOpacity>
									<CancelButton />
								</>
							);
						case "waitSync":
							return <CancelButton />;
						case "done":
							return (
								<>
									<TouchableOpacity
										style={style.buttonStyle}
										onPress={() => props.navigation.pop()}>
										<Text style={style.buttonTextStyle}>
											{getStr("return")}
										</Text>
									</TouchableOpacity>
								</>
							);
					}
				})()}
			</View>
		</>
	);
}
