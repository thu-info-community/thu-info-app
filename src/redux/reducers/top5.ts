import {defaultTop5, Top5} from "../states/top5";
import {Top5Action} from "../actions/top5";

export const top5 = (state: Top5 = defaultTop5, action: Top5Action): Top5 => {
	switch (action.type) {
		case "TOP5_UPDATE":
			const income = action.payload;
			let newFunctions = state.top5Functions.slice(0, 5);
			if (newFunctions.includes(income)) {
				if (newFunctions.indexOf(income) !== 0) {
					newFunctions = newFunctions.filter((x) => x !== income);
					newFunctions.unshift(income);
				} else {
					// do nothing.
				}
			} else {
				newFunctions.unshift(income);
			}
			return {
				top5Functions: newFunctions.slice(0, 5),
			};
		case "TOP5_SET":
			return {
				top5Functions: action.payload.slice(0, 5),
			};
		default:
			return state;
	}
};
