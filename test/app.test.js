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

test('a commit message can be included on a build', async (test) => {
  const { app, client, slug } = test.context;
  const commitMessage = uuid();
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const build = await app.triggerBuild({ commitMessage });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { commit_message: commitMessage },
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

test('build status reporting can be disabled', async (test) => {
  const { app, client, slug } = test.context;
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const build = await app.triggerBuild({ disableStatusReporting: true });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { skip_git_status_report: true },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});

test('a pull request ID can be assigned to a build', async (test) => {
  const { app, client, slug } = test.context;
  const pullRequest = uuid();
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const build = await app.triggerBuild({ pullRequest });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { pull_request_id: pullRequest },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});

test('a target branch can be included on a build', async (test) => {
  const { app, client, slug } = test.context;
  const target = uuid();
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const build = await app.triggerBuild({ target });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { branch_dest: target },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});

test('a source branch can be included on a build', async (test) => {
  const { app, client, slug } = test.context;
  const branch = uuid();
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const build = await app.triggerBuild({ branch });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: { branch },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});

test('environment variables can be supplied to a build', async (test) => {
  const { app, client, slug } = test.context;
  const stub = stubTriggerBuild({ appSlug: slug, axios: client });

  const environment = {
    VARIABLE_ONE: uuid(),
    VARIABLE_TWO: uuid()
  };

  const build = await app.triggerBuild({ environment });
  test.is(build.appSlug, slug);
  test.is(build.buildSlug, stub.build.build_slug);

  sinon.assert.calledOnce(client.post);
  sinon.assert.calledWithExactly(
    client.post,
    sinon.match.string,
    sinon.match({
      build_params: {
        environments: [
          { mapped_to: 'VARIABLE_ONE', value: environment.VARIABLE_ONE },
          { mapped_to: 'VARIABLE_TWO', value: environment.VARIABLE_TWO }
        ]
      },
      hook_info: { type: 'bitrise' },
      triggered_by: '@lifeomic/bitrise'
    })
  );
});
