const fs = require("fs");
const child_process = require("child_process");
const semver = require("semver");
const pkg = require("./package.json");

if (
    !(
        (process.argv.length === 4 &&
            (process.argv[2] === "draft" || process.argv[2] === "release")) ||
        (process.argv.length === 5 &&
            process.argv[2] === "release" &&
            process.argv[4] === "--pick-draft")
    )
) {
    console.error("Commandline argument error!");
    process.exit(1);
}

let [command, message] = process.argv.slice(2);

if (command === "draft") {
    console.info("Saving message to draft...");
    if (
        message.endsWith("，") ||
        message.endsWith("。") ||
        message.endsWith("；")
    ) {
        console.warn(
            "The `" +
            message[message.length - 1] +
            "` at the end of the message will be omitted.",
        );
        message = message.slice(0, message.length - 1);
    }
    fs.writeFileSync("./draft", message + "\n", {flag: "a"});
    child_process.execSync("git add ./draft");
} else if (command === "release") {
    const version = semver.coerce(message);
    if (!semver.valid(version)) {
        console.error("Version number provided MUST follow semver!");
        process.exit(1);
    } else if (!semver.gt(version, pkg.version)) {
        console.error("Version number provided MUST be greater than before!");
        process.exit(1);
    }

    // Currently a naive way of editing package.json is adopted.
    const pkgString = fs.readFileSync("./package.json").toString();
    fs.writeFileSync(
        "./package.json",
        pkgString
            .replace(`"version": "${pkg.version}"`, `"version": "${version}"`),
    );

    if (process.argv.length === 5) {
        console.info("Converting draft to release...");
        // Then must have --pick-draft
        const draft = fs.readFileSync("./draft").toString();
        const release =
            draft.trim().length > 0
                ? draft
                    .split("\n")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                    .join("；\n")
                    .concat("。")
                : "";
        fs.writeFileSync("./release", release);
        fs.writeFileSync("./draft", "");
        child_process.execSync("git add ./release ./draft ./package.json");
    } else {
        fs.writeFileSync("./release", "");
        child_process.execSync("git add ./release ./package.json");
    }

    child_process.execSync(`git commit -m "Release: ${version}"`);
    child_process.execSync(`git tag v${version} -am "Release: ${version}"`);
} else {
    process.exit(1);
}
