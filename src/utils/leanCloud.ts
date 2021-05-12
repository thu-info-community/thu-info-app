import AV from "leancloud-storage/core";
import VersionNumber from "react-native-version-number";
import {currState, helper, store} from "../redux/store";
import {configSet} from "../redux/actions/config";
import {Platform} from "react-native";

export const leanCloudInit = () => {
	const state = currState();
	if (state.config.lastSelfVersion < Number(VersionNumber.buildVersion)) {
		const statistics = new (AV.Object.extend("Statistics"))();
		statistics.set("version", Number(VersionNumber.buildVersion));
		statistics.set("last", state.config.lastSelfVersion);
		statistics.set("year", state.auth.userId.substring(0, 4));
		statistics.set("end", state.auth.userId[state.auth.userId.length - 1]);
		statistics.set("os", Platform.OS);
		statistics.set("api", String(Platform.Version));
		statistics.save().then(console.log);
		store.dispatch(
			configSet("lastSelfVersion", Number(VersionNumber.buildVersion)),
		);
	}
};

export const submitFeedback = async (content: string) => {
	if (!helper.mocked()) {
		const statistics = new (AV.Object.extend("Feedback"))();
		statistics.set("version", Number(VersionNumber.buildVersion));
		statistics.set("os", Platform.OS);
		statistics.set("api", String(Platform.Version));
		statistics.set("content", content);
		return statistics.save();
	}
};
