# thu-info-lib

[![Build Status](https://github.com/thu-info-community/thu-info-lib/workflows/Test%20and%20Publish/badge.svg)](https://github.com/thu-info-community/thu-info-lib/actions?query=workflow%3A%22Test+and+Publish%22)
[![NPM Version](https://img.shields.io/npm/v/thu-info-lib)](https://www.npmjs.com/package/thu-info-lib)

This is a JavaScript library aimed to provide a program-friendly interface to Tsinghua web portal, and is licensed under MIT License.

## Installation

```shell
yarn add thu-info-lib
```

## Usage

See [wiki](https://github.com/thu-info-community/thu-info-lib/wiki).

## Compatibility

Tested across node, browsers and react-native.

## Build from source

### Library version (for development or Node)

`yarn && yarn build`

You can find the library version in `dist/`. It can be used in web development or imported with NodeJS (with all dependencies installed). It **SHOULD NOT** be used directly in browsers.

### Bundled version (for browsers)

`yarn && yarn build-dist`

You can find the bundled version in `demo/`. You can install the directory as an unpacked extension in Chrome, then execute anything you want in the Console of Chrome Developer Tool. The helper class and utility types is attached as `window.InfoHelper` in this mode.

Use `yarn watch-dist` for watching file changes.

## Testing

Run `yarn test` for testing. It requires your personal credential since we don't have mocks for these APIs. To do this, you must create a `secrets.json`  under the root folder, with `userId`, `password`, `dormPassword` and `emailName` as keys.

It's ok if you meet `Timeout * Async callback was not invoked within the xxx-ms timeout...` error when running tests. Adjusting the third argument timeout of the failing testcase `it("xxx", async () => void, timeout)` might solve the problem.

Due to various reasons, some test cases might fail. Re-running them might solve the problem.

## Changelog

- v1.0.0
  - First release

## Acknowledgement

Great thanks to [Harry-Chen](https://github.com/Harry-Chen) and his [thu-learn-lib](https://github.com/Harry-Chen/thu-learn-lib)!
