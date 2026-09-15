# thu-info-app

[![Build Status](https://github.com/thu-info-community/thu-info-app/workflows/Build%20Android%20and%20iOS/badge.svg)](https://github.com/thu-info-community/thu-info-app/actions?query=workflow%3A%22Build+Android+and+iOS%22) [![GitHub release](https://img.shields.io/github/v/release/thu-info-community/thu-info-app)](https://github.com/thu-info-community/thu-info-app/releases) [![Platform Android](https://img.shields.io/badge/platform-android-brightgreen)](https://app.cs.tsinghua.edu.cn/api/apk) [![Platform iOS](https://img.shields.io/badge/platform-ios-brightgreen)](https://apps.apple.com/cn/app/thu-info/id1533968428) [![Platform HarmonyOS](https://img.shields.io/badge/platform-HarmonyOS-brightgreen)](https://appgallery.huawei.com/app/detail?id=com.unidy2002.thuinfo)

An APP aimed at integrating various sources of campus information.

**[Checkout our official website!](https://app.cs.tsinghua.edu.cn/)**

## Release

Android:

- [First-party download (Recommended)](https://app.cs.tsinghua.edu.cn/api/apk)
- [TUNA Mirror](https://mirrors.tuna.tsinghua.edu.cn/github-release/thu-info-community/thu-info-app/LatestRelease/)
- [BFSU Mirror](https://mirrors.bfsu.edu.cn/github-release/thu-info-community/thu-info-app/LatestRelease/)

iOS: [App Store](https://apps.apple.com/cn/app/thu-info/id1533968428)

HarmonyOS: [AppGallery](https://appgallery.huawei.com/app/detail?id=com.unidy2002.thuinfo)

### Verify downloads

Push builds generate GitHub build provenance attestations for the Android APK, iOS IPA, and signed HarmonyOS HAP and APP artifacts. These attestations identify the source revision and workflow that produced the exact downloaded bytes. They apply to CI artifacts, including APKs distributed through GitHub Releases and mirrors, provided the file is unchanged. They do not cover binaries subsequently processed by app stores. iOS attestation runs after the existing TestFlight upload.

Install the [GitHub CLI](https://cli.github.com/) and authenticate with `gh auth login`. To verify an Android release download, set the tag and local file path:

```bash
TAG=vX.Y.Z # Replace with the downloaded release's tag.
FILE="THUInfo_release_${TAG}.apk"
gh attestation verify "$FILE" \
  -R thu-info-community/thu-info-app \
  --signer-workflow thu-info-community/thu-info-app/.github/workflows/ci.yml \
  --source-ref "refs/tags/$TAG"

gh release verify "$TAG" -R thu-info-community/thu-info-app
gh release verify-asset "$TAG" "$FILE" -R thu-info-community/thu-info-app
```

For branch CI artifacts, use the downloaded artifact's path and replace `refs/tags/$TAG` with `refs/heads/BRANCH`. Add `--source-digest COMMIT_SHA` to verify a specific build revision. The two `gh release` commands apply only to immutable GitHub Releases and their attached assets; GitHub Releases contain the Android APK only. Builds predating attestation support cannot be verified with these commands.

### Release immutability setup

After the attestation workflow is validated, enable **Settings → General → Releases → Enable release immutability** in this GitHub repository. This repository setting is required to generate automatic release attestations and applies only to future releases. See [GitHub's setup instructions](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/prevent-release-changes).

Tagged Android builds attest the APK before the release action uploads it to a draft and publishes the release. Tags containing a hyphen, such as `v3.17.0-alpha1`, are published as prereleases and do not replace the latest stable release. Failed drafts can be retried. Reruns for an already published immutable release generate new CI artifacts and attestations but skip release publication. To publish changed binaries, create a new version tag: published immutable assets and their associated tag cannot be replaced or moved.

---

If you are a developer...

## Build from source

### Prerequisites

#### Android

- [Node.js](https://nodejs.org/) >= 18
- [Yarn](https://classic.yarnpkg.com/lang/en/) Classic
- [JDK](https://adoptium.net/temurin/releases) >= 17
- [Android Studio](https://developer.android.com/studio/index.html) or [Intellij IDEA](https://www.jetbrains.com/idea/) with `Android SDK Platform 34` and `Android SDK Build-Tools 34.0.0` installed.

#### iOS

**Make sure you have Xcode >= 12 installed and the command line tools enabled.**

We recommend using [Homebrew](https://brew.sh/) to install the tools required.

```bash
brew install node
brew install yarn
brew install cocoapods
brew install watchman   # optional, install only for higher development performance
```

#### HarmonyOS

- [DevEco Studio](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-software-install-V5)
- [Yarn](https://classic.yarnpkg.com/lang/en/) Classic

We recommend following the official docs:

- [环境搭建.md](https://gitcode.com/openharmony-sig/ohos_react_native/blob/master/docs/zh-cn/%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA.md)
- [environment-setup.md](https://gitcode.com/openharmony-sig/ohos_react_native/blob/master/docs/en/environment-setup.md)

**Make sure you have environment variable `RNOH_C_API_ARCH=1` set.**

### Building (Android, iOS)

```bash
cd thu-info-app
yarn
yarn android                  # For Android
npx pod-install && yarn ios   # For iOS
```

### Building (HarmonyOS)

```bash
cd thu-info-app
./setup-harmony.sh
cd apps/thu-info-app
yarn codegen-harmony
yarn bundle-harmony
```

Build and run project with DevEco Studio.

> Optional: for react-native hot reload
> 
> ```bash
> hdc rport tcp:8081 tcp:8081
> yarn start
> ```

## Contributing

Please follow the [Contributing guidelines](CONTRIBUTING.md).

## Commercial Use

The source code is licenced under Business Source License 1.1, and is not allowed for commercial use unless explicitly granted by UNIDY2002 or after the Change Date arrives.

## Acknowledgement

Great thanks to the [learnX](https://github.com/robertying/learnX) project, without referring to whose code the migration to React Native would never be as smooth.

Best regards to the JavaScript and the React Native community.
