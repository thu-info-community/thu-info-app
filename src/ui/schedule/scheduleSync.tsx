import {Modal, Text, TouchableOpacity, View} from "react-native";
import {ScheduleSyncReceiving, ScheduleSyncSending} from "../../utils/webApi";
import {currState, store} from "../../redux/store";
import React, {useRef, useState} from "react";
import {Schedules} from "../../redux/states/schedule";
import {scheduleSyncAction} from "../../redux/actions/schedule";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";

export const ScheduleSyncScreen = (props: any) => {
	const [show, setShow] = useState(false);
	const [status, setStatus] = useState("Matching another device...");
	const [canSync, setCanSync] = useState(false);
	const [canStart, setCanStart] = useState(true);
	const isSending = props.route.params.isSending;
	const client = useRef<any>();
	if (!client.current) {
		client.current = isSending
			? new ScheduleSyncSending(currState().auth.userId)
			: new ScheduleSyncReceiving(currState().auth.userId);
	}
	let payload: Schedules;
	if (isSending) {
		payload = currState().schedule;
	}
	return (
		<>
			{isSending ? (
				<Text>You are going to send schedule data to other device.</Text>
			) : (
				<Text>You are going to receive schedule data from other device.</Text>
			)}
			{!isSending && (
				<Text style={{color: "red"}}>
					Waring!!! Receiving schedule data from other device will replace all
					your current local schedule data with what you received.
				</Text>
			)}
			{isSending ? (
				<>
					<TouchableOpacity
						disabled={!canStart}
						onPress={async () => {
							try {
								setCanStart(false);
								await client.current.start((token: string) => {
									setStatus(
										`The matching token is ${token}, please ensure the token on another device is the same.`,
									);
									setCanSync(true);
								});
								setShow(true);
							} catch {
								setCanStart(true);
								NetworkRetry();
							}
						}}>
						<Text>Start Sending</Text>
					</TouchableOpacity>
					<Modal transparent visible={show}>
						<View
							style={{
								backgroundColor: "black",
								opacity: 0.1,
								width: "100%",
								height: "100%",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<View
								style={{backgroundColor: "white", opacity: 1, width: "70%"}}>
								<Text style={{backgroundColor: "red"}}>{status}</Text>
								<TouchableOpacity
									onPress={async () => {
										await client.current.stop();
										setShow(false);
										setCanStart(true);
									}}>
									<Text>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									disabled={!canSync}
									onPress={async () => {
										await client.current.confirmAndSend(
											JSON.stringify(payload),
											() => {
												setShow(false);
												props.navigation.pop();
												Snackbar.show({
													text: "Sync completed",
													duration: Snackbar.LENGTH_SHORT,
												});
											},
										);
										setCanSync(false);
										setStatus("Waiting for another device...");
									}}>
									<Text>Sync</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>
				</>
			) : (
				<>
					<TouchableOpacity
						disabled={!canStart}
						onPress={async () => {
							try {
								setCanStart(false);
								await client.current.start((token: string) => {
									setStatus(
										`The matching token is ${token}, please ensure the token on another device is the same.`,
									);
									setCanSync(true);
								});
								setShow(true);
							} catch {
								setCanStart(true);
								NetworkRetry();
							}
						}}>
						<Text>Start Receiving</Text>
					</TouchableOpacity>
					<Modal transparent visible={show}>
						<View
							style={{
								backgroundColor: "black",
								opacity: 0.1,
								width: "100%",
								height: "100%",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<View
								style={{backgroundColor: "white", opacity: 1, width: "70%"}}>
								<Text style={{backgroundColor: "red"}}>{status}</Text>
								<TouchableOpacity
									onPress={async () => {
										await client.current.stop();
										setShow(false);
										setCanStart(true);
									}}>
									<Text>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									disabled={!canSync}
									onPress={async () => {
										await client.current.confirmAndReceive((json: string) => {
											store.dispatch(scheduleSyncAction(JSON.parse(json)));
											setShow(false);
											props.navigation.pop();
											Snackbar.show({
												text: "Sync completed",
												duration: Snackbar.LENGTH_SHORT,
											});
										});
										setCanSync(false);
										setStatus("Waiting for another device...");
									}}>
									<Text>Sync</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>
				</>
			)}
		</>
	);
};
