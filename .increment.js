const fs = require("fs");
const pkg = require("./package.json");

const pkgString = fs.readFileSync("./package.json").toString();
fs.writeFileSync("./package.json", pkgString.replace(`"build": ${pkg.build}`, `"build": ${pkg.build + 1}`));

// Generate commit log
const {execSync} = require("child_process");

const lastReleaseTag = execSync("git describe --tags --abbrev=0").toString().trim();
const rawCommitLog = execSync(`git rev-list --pretty=oneline ${lastReleaseTag}..HEAD`).toString().split("\n").reverse();
const commitLog = [];

for (const rawCommitMsg of rawCommitLog) {
  // Ignore all dependency commits
  if (rawCommitMsg === "" || rawCommitMsg.search("(deps)") !== -1)
    continue;

  // Remove commit hash
  let commitMsg = rawCommitMsg.split(" ").slice(1).join(" ");

  if (commitMsg.search(/^\w+:/) === -1) {
    console.log("Commit message does not start with a scope:", commitMsg);
    continue;
  }

  commitLog.push(commitMsg.split(":").slice(1).join(":").trim());
}

commitLog.push("Updated dependencies");

console.log("------------\n" + commitLog.join("\n"));
fs.writeFileSync("./commit-log.txt", commitLog.join("\n"));
