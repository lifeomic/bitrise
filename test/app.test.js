const app = require('../src/app');
const axios = require('axios');
const sinon = require('sinon');
const test = require('ava');
const uuid = require('uuid/v4');

const { stubTriggerBuild } = require('./stubs');

test.beforeEach((test) => {
  const client = axios.create();
  const slug = uuid();

  test.context.app = app({ client, slug });
  test.context.client = client;
  test.context.slug = slug;
});

test('an app has a slug', (test) => {
  const { app, slug } = test.context;
  test.is(app.slug, slug);
});

test('an app can trigger a new build', async (test) => {
  const { app, client, slug } = test.context;
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const build = await app.triggerBuild();
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { branch: 'master' },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});

test('an app can trigger a build for a specific commit', async (test) => {
  const { app, client, slug } = test.context;
  const commitHash = uuid();
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const build = await app.triggerBuild({ commitHash });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { commit_hash: commitHash },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});

test('an app can trigger a specific build workflow', async (test) => {
  const { app, client, slug } = test.context;
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });
  const workflow = 'test';

  const build = await app.triggerBuild({ workflow });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { branch: 'master', workflow_id: workflow },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});
