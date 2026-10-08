import dayjs from "dayjs";

/**
 * Render a server timestamp the way the app does elsewhere (see
 * `ui/home/expenditure.tsx`): `YYYY-MM-DD HH:mm`. The API sends ISO strings
 * with microseconds (`2026-09-09T11:27:00.688348`), which are unreadable as-is.
 * Anything dayjs cannot parse is passed through unchanged rather than blanked.
 */
export const formatTimestamp = (raw: string): string => {
	if (!raw) {
		return "";
	}
	const parsed = dayjs(raw);
	return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : raw;
};
