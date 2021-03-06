bitrise
=======

[![Build Status](https://travis-ci.org/lifeomic/bitrise.svg?branch=master)](https://travis-ci.org/lifeomic/bitrise)
[![Coverage Status](https://coveralls.io/repos/github/lifeomic/bitrise/badge.svg?branch=master)](https://coveralls.io/github/lifeomic/bitrise?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/lifeomic/bitrise.svg)](https://greenkeeper.io/)

A simple API client for the [Bitrise API][bitrise-api].

## Usage

    $ npm install --save @lifeomic/bitrise

## API

### bitrise({ token })

Create a new client instance. `token` is a [personal access token][bitrise-auth].

    const bitrise = require('@lifeomic/bitrise');
    const client = bitrise({ token: 'some-token' });

### bitrise.app({ slug })

Create an app object. `slug` is the Bitrise app slug.

    const bitrise = require('@lifeomic/bitrise');
    const app = bitrise({ token }).app({ slug });

An app has the following attributes:

  - **slug** — the app's unique identifier.

### async app.triggerBuild(options)

Trigger a new build for the app. Supported `options` include the following:

  - **branch** — the branch to run (or the source of a pull request). The
    default is `master`.
  - **commitHash** — the hash of the commit to checkout of SCM. If not provided
    then the `branch` parameter is used.
  - **commitMessage** — a description to include on the build.
  - **disableStatusReporting** — disable sending status reports to SCM.
  - **environment** — an object of key value pairs representing environment
    variables to provide to the build.
  - **pullRequest** — the ID of the pull request being built.
  - **target** — the destination branch of the pull request.
  - **workflow** — the ID of the Bitrise workflow to run.

Returns a `build` object representing the build that was started. A build has
the following attributes:

  - **appSlug** — the slug of the application that the build is for.
  - **buildSlug** — the unique ID of the build.

References:
  - https://devcenter.bitrise.io/api/v0.1/#post-appsapp-slugbuilds

### async build.abort({ reason })

Abort the build. If supplied the `reason` string will be included in the build
details.

References:
 - https://devcenter.bitrise.io/api/v0.1/#post-appsapp-slugbuildsbuild-slugabort

### async build.describe()

Get all attributes for a build.

References:
  - https://devcenter.bitrise.io/api/v0.1/#post-appsapp-slugbuilds

### async build.follow({ heartbeat, interval })

Poll on the logs for a build and print them to stdout. An error will be thrown
if the build fails. `interval` is the polling interval in milliseconds
(default value is `5000`). `heartbeat` is the maximum interval that no output
can be received in milliseconds. When this value is supplied a heartbeat message
will be printed if no output has been received. When it is not supplied nothing
is printed unless output is received from the build.

References:
  - https://devcenter.bitrise.io/api/v0.1/#get-appsapp-slugbuildsbuild-sluglog
  - https://devcenter.bitrise.io/api/v0.1/#get-appsapp-slugbuildsbuild-slug

### async build.isFinished()

Returns `true` if the build has completed execution (regardless of success or
failure). Returns `false` otherwise. This is just a convenience method for
running `build.describe()` and checking the `finished_at` attribute.

References:
  - https://devcenter.bitrise.io/api/v0.1/#get-appsapp-slugbuildsbuild-slug

[bitrise-api]: https://devcenter.bitrise.io/api/v0.1/ "Bitrise API"
[bitrise-auth]: https://devcenter.bitrise.io/api/v0.1/#authentication "API Authorization"
