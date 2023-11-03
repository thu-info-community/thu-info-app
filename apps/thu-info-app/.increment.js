const fs = require("fs");
const pkg = require("./package.json");

const pkgString = fs.readFileSync("./package.json").toString();
fs.writeFileSync("./package.json", pkgString.replace(`"build": ${pkg.build}`, `"build": ${pkg.build + 1}`).replace(`"@thu-info/lib": "${pkg.dependencies["@thu-info/lib"]}"`, `"@thu-info/lib": "*"`));
