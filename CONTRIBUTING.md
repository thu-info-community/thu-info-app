# Contributing to thu-info-app

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to [thu-info-app](https://github.com/thu-info-community/thu-info-app), which is hosted on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

**NOTICE: Contributions to this repository are limited to students at Tsinghua University.**

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [i@thuinfo.net](mailto:i@thuinfo.net).

## I don't want to read this whole thing I just have a question!!!

**You are not recommended to file an issue to ask a question.** You'll get faster results through the following approaches:

- In-application feedback system (submit feedbacks with your contact attached for faster responses)
- Email to [i@thuinfo.net](mailto:i@thuinfo.net)

- [Github Discussions](https://github.com/thu-info-community/thu-info-app/discussions)

## What should I know before I get started?

Code of THUInfo APP is separated into two repositories:

- **[thu-info-app](https://github.com/thu-info-community/thu-info-app)** contains code for the mobile application, mostly regarding the UI part, which is written using react native.
- **[thu-info-lib](https://github.com/thu-info-community/thu-info-lib)** contains code that handles interaction with the official websites and parsing of HTTP responses, and is written in TypeScript.

Before you contribute, make sure you have chosen the correct repository.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you've determined which repository your bug is related to, create an issue on that repository and provide the following information by filling in [the template](.github/ISSUE_TEMPLATE/bug_report.md).

Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible. For example, start by explaining which function of THUInfo are you using.
* **Provide a detailed description of the problem**. For example, if you want to report an error in the display of classroom status, provide in detail which classroom and which date is causing the problem.
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem.
* **If you're reporting that some operations cannot be performed**, such as occurrence of a failed network request, include the error message (if exists) when reporting.
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and share more information using the guidelines below.

Provide more context by answering these questions:

* **What is the version of the application you are using?**
* **Did the problem start happening recently** (e.g. after updating to a new version of THUInfo) or was this always a problem?
* If the problem started happening recently, **can you reproduce the problem in an older version of THUInfo?** What's the most recent version (or most recent date) in which the problem doesn't happen? You can download older versions of THUInfo from [the releases page](https://github.com/thu-info-community/thu-info-app/releases).
* **Can you reliably reproduce the issue?** If not, provide details about how often the problem happens and under which conditions it normally happens.

Include details about your device and environment:

* **What's the name and version of the device you're using**?
* **Are you running THUInfo in a virtual machine?** If so, which VM software are you using and which operating systems and versions are used for the host and the guest?

### Suggesting Enhancements

Enhancement suggestions are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you've determined which repository your enhancement suggestion is related to, create an issue on that repository and provide the following information:

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
* **Include screenshots and animated GIFs** which help you demonstrate the steps or point out the part of THUInfo which the suggestion is related to.
* **Explain why this enhancement would be useful** to most THUInfo users.
* **Specify which version of THUInfo you're using.**
* **Specify the name and version of the device you're using.**

**Read the following notices before you suggest a feature request:**

- Please understand that **making a new feature PR** before **creating a feature suggestion issue** has a high chance of rejection.
- **Features that are considered inappropriate to enter THUInfo APP as an APP function** by the core team might be rejected. You can still contribute in [thu-info-community/thu-info-lib](https://github.com/thu-info-community/thu-info-lib) and enjoy the new features as a command line application.
- **The core team reserves the right to make changes to your contribution**, mostly in the purpose of ensuring consistency in the UI design.

### Pull Requests

Please follow all instructions in [the template](PULL_REQUEST_TEMPLATE.md) before you submit a pull request.

The process of filling out the PR template has several goals: 

- Maintain THUInfo's quality
- Fix problems that are important to users
- Engage the community in working towards the best possible THUInfo
- Enable a sustainable system for THUInfo's maintainers to review contributions
