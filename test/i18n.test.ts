import zh from "../src/assets/translations/zh";
import en from "../src/assets/translations/en";

test("Translations objects should have the same keys.", () => {
	expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
});
