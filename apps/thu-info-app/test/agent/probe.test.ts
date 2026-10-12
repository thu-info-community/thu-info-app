import {probeToolSupport} from "../../src/agent/probe";
import {campusModel} from "../../src/agent/types";
import {call, scripted} from "./fixtures";

test("gateway probe requires an actual valid forced function call, never prose", async () => {
	const valid = scripted([
		{calls: [call("agent_compatibility_probe", {value: "ok"})]},
	]);
	expect(await probeToolSupport(valid.transport, campusModel)).toBe(true);
	expect(valid.bodies[0].model).toBe("DeepSeek-V4.1-Flash");
	expect(valid.bodies[0].tool_choice).toEqual({
		type: "function",
		function: {name: "agent_compatibility_probe"},
	});
	const prose = scripted([
		{text: 'I called agent_compatibility_probe({"value":"ok"})'},
	]);
	expect(await probeToolSupport(prose.transport, campusModel)).toBe(false);
	const invalid = scripted([
		{calls: [call("agent_compatibility_probe", {value: "other"})]},
	]);
	expect(await probeToolSupport(invalid.transport, campusModel)).toBe(false);
});

test("non-thinking diagnostic sends the documented toggle but never changes capabilities", async () => {
	const {transport, bodies} = scripted([{text: "No function call"}]);
	expect(await probeToolSupport(transport, campusModel, undefined, true)).toBe(
		false,
	);
	expect(bodies[0].thinking).toEqual({type: "disabled"});
	expect(campusModel.thinkingLevels).toEqual(["default"]);
});
