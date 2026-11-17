import {useEffect, useRef} from "react";
import {useIsFocused} from "@react-navigation/native";
import {useSelector} from "react-redux";
import type {State} from "../redux/store";

/** Refresh affected native screens on focus, not during an off-screen agent write. */
export const useNewsInvalidation = (refresh: () => void) => {
	const revision = useSelector((state: State) => state.deepseek.newsRevision ?? 0);
	const focused = useIsFocused();
	const seen = useRef(revision);
	const callback = useRef(refresh);
	useEffect(() => {
		callback.current = refresh;
	}, [refresh]);
	useEffect(() => {
		if (focused && seen.current !== revision) {
			seen.current = revision;
			callback.current();
		}
	}, [focused, revision]);
};
