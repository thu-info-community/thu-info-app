# thu-info-lib

[![Build Status](https://github.com/UNIDY2002/thu-info-lib/workflows/Test%20and%20Publish/badge.svg)](https://github.com/UNIDY2002/thu-info-lib/actions?query=workflow%3A%22Test+and+Publish%22)

This is a JavaScript library aimed to provide a program-friendly interface to Tsinghua web portal, and is licensed under MIT License.

## Compatibility

TODO

## Installation

```shell
yarn add thu-info-lib
```

## Build from source

TODO

## Usage

See [wiki](https://github.com/UNIDY2002/thu-info-lib/wiki).

## Testing

Run yarn test for testing. It requires your personal credential since we don't have mocks for these APIs. To do this, you must create a `secrets.json`  under the root folder, with `userId`, `password`, `dormPassword` and `emailName` as keys.

It's ok if you meet `Timeout * Async callback was not invoked within the xxx-ms timeout...` error when running tests. Rerunning tests may resolve this problem. If you hate this, just adjust the third argument timeout of every testcase `it("xxx", async () => void, timeout)`.

## Changelog

- v1.0.0
  - First release

## Acknowledgement

Great thanks to [Harry-Chen](https://github.com/Harry-Chen) and his [thu-learn-lib](https://github.com/Harry-Chen/thu-learn-lib)!
