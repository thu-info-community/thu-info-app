import AV from "leancloud-storage/core";

export const toggleSocketState = async (
	seatId: number,
	objectId: string,
	target: boolean,
) => {
	const socket = AV.Object.createWithoutData("Sockets", objectId);
	socket.set("available", target);
	await socket.save();
};
