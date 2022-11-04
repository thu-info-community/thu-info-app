# thu-info-app

[![Build Status](https://github.com/thu-info-community/thu-info-app/workflows/Build%20Android%20and%20iOS/badge.svg)](https://github.com/thu-info-community/thu-info-app/actions?query=workflow%3A%22Build+Android+and+iOS%22) [![GitHub release](https://img.shields.io/github/v/release/thu-info-community/thu-info-app)](https://github.com/thu-info-community/thu-info-app/releases) [![Platform Android](https://img.shields.io/badge/platform-android-brightgreen)](https://install.appcenter.ms/users/unidy/apps/thuinfo/distribution_groups/cd) [![Platform iOS](https://img.shields.io/badge/platform-ios-brightgreen)](https://apps.apple.com/cn/app/thu-info/id1533968428)

An APP aimed at integrating various sources of campus information.

**[Checkout our official website!](https://thuinfo.net/)**

## Release

Android:

- [Tuna Mirror (Recommended)](https://mirrors.tuna.tsinghua.edu.cn/github-release/thu-info-community/thu-info-app/LatestRelease/)
- [BSFU Mirror](https://mirrors.bfsu.edu.cn/github-release/thu-info-community/thu-info-app/LatestRelease/)
- [App Center](https://install.appcenter.ms/users/unidy/apps/thuinfo/distribution_groups/cd)

iOS: [App Store](https://apps.apple.com/cn/app/thu-info/id1533968428)

---

If you are a developer...

## Build from source

### Prerequisites

#### Android

- [Node.js](https://nodejs.org/) >= 14
- [Yarn](https://classic.yarnpkg.com/lang/en/) Classic
- [JDK](https://adoptium.net/temurin/releases) >= 11
- [Android Studio](https://developer.android.com/studio/index.html) or [Intellij IDEA](https://www.jetbrains.com/idea/) with `Android SDK Platform 33` and `Android SDK Build-Tools 33.0.0` installed.

#### iOS

**Make sure you have Xcode >= 12 installed and the command line tools enabled.**

We recommend using [Homebrew](https://brew.sh/) to install the tools required.

```bash
brew install node
brew install yarn
brew install cocoapods
brew install watchman   # optional, install only for higher development performance
```

### Building

```bash
cd thu-info-app
yarn
yarn android                  # For Android
npx pod-install && yarn ios   # For iOS
```

## Contributing

Please follow the [Contributing guidelines](CONTRIBUTING.md).

## Acknowledgement

Great thanks to the [learnX](https://github.com/robertying/learnX) project, without referring to whose code the migration to React Native would never be as smooth.

Best regards to the JavaScript and the React Native community.
