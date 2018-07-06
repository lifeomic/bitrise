bitrise
=======

[![Build Status](https://travis-ci.org/lifeomic/bitrise.svg?branch=master)](https://travis-ci.org/lifeomic/bitrise)
[![Coverage Status](https://coveralls.io/repos/github/lifeomic/bitrise/badge.svg?branch=master)](https://coveralls.io/github/lifeomic/bitrise?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/lifeomic/bitrise.svg)](https://greenkeeper.io/)

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

  - **commitHash** — the hash of the commit to checkout of SCM. By default
    the `master` branch is run.
  - **workflow** — the ID of the Bitrise workflow to run.

Returns a `build` object representing the build that was started. A build has
the following attributes:

  - **appSlug** — the slug of the application that the build is for.
  - **buildSlug** — the unique ID of the build.

References:
  - https://devcenter.bitrise.io/api/v0.1/#post-appsapp-slugbuilds

### async build.describe()

Get all attributes for a build.

References:
  - https://devcenter.bitrise.io/api/v0.1/#post-appsapp-slugbuilds

### async build.follow()

Poll on the logs for a build and print them to stdout. An error will be thrown
if the build fails.

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
