const axios = require('axios');
const artifact = require('../src/artifact');
const test = require('ava');
const uuid = require('uuid/v4');

const { stubGetArtifact } = require('./stubs');

test.beforeEach((test) => {
  const appSlug = uuid();
  const buildSlug = uuid();
  const artifactSlug = uuid();
  const client = axios.create();

  test.context.appSlug = appSlug;
  test.context.artifactSlug = artifactSlug;
  test.context.artifact = artifact({ appSlug, buildSlug, artifactSlug, client });
  test.context.buildSlug = buildSlug;
  test.context.client = client;
});

test('has app, build, and artifact slugs', (test) => {
  const { appSlug, artifact, buildSlug, artifactSlug } = test.context;
  test.is(artifact.appSlug, appSlug);
  test.is(artifact.buildSlug, buildSlug);
  test.is(artifact.artifactSlug, artifactSlug);
});

test('describing an artifact returns the artifact attributes', async (test) => {
  const { appSlug, artifact, buildSlug, artifactSlug, client } = test.context;
  const stub = stubGetArtifact({ axios: client, appSlug, buildSlug, artifactSlug });

  const description = await artifact.describe();
  test.deepEqual(description, stub.artifact);
});
