import dayjs from "dayjs";

export const enableEasterEgg = () => {
	const today = dayjs();
	return today.month() === 3 && today.date() === 1;
};
