import {expect, it, jest} from "@jest/globals";
import "react-native";
import "react-native-get-random-values";
import React from "react";
import {App} from "../src/App";
import {render, screen, userEvent} from "@testing-library/react-native";

jest.setTimeout(90000);

// eslint-disable-next-line jest/no-disabled-tests
it.skip("renders correctly", async () => {
	// Render the app
	const user = userEvent.setup();
	render(<App />);

	// Test top5
	const top5Recently = screen.getByTestId("homeFunctions-recentlyUsedFunction").children[0];
	const top5All = screen.getByTestId("homeFunctions-allFunction").children[0];
	expect(typeof top5Recently === "string").toBeFalsy();
	expect(typeof top5All === "string").toBeFalsy();
	if (typeof top5Recently === "string" || typeof top5All === "string") {
		return;
	}
	expect(top5Recently.children.length).toEqual(1);
	expect(top5All.children.length).toBeGreaterThan(0);

	// Press a home page function
	await user.press(screen.getByTestId("HomeIcon-classroomState"));

	// Perform login
	await user.type(screen.getByTestId("loginUserId"), "8888");
	await user.type(screen.getByTestId("loginPassword"), "8888");
	await user.press(screen.getByTestId("loginButton"));

	/* const top5RecentlyNew = screen.getByTestId("homeFunctions-recentlyUsedFunction").children[0];
	expect(typeof top5RecentlyNew === "string").toBeFalsy();
	if (typeof top5RecentlyNew === "string") {
		return;
	}
	expect(top5RecentlyNew.children.length).toEqual(1); */
});
