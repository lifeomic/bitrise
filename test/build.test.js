const axios = require('axios');
const build = require('../src/build');
const sinon = require('sinon');
const test = require('ava');
const uuid = require('uuid/v4');

const { DateTime } = require('luxon');
const { stubAbortBuild, stubArchivedBuildLog, stubBuildLogStream, stubGetBuild } = require('./stubs');

test.beforeEach((test) => {
  const appSlug = uuid();
  const buildSlug = uuid();
  const client = axios.create();

  test.context.appSlug = appSlug;
  test.context.build = build({ appSlug, buildSlug, client });
  test.context.buildSlug = buildSlug;
  test.context.client = client;
});

test('a build has a slug', (test) => {
  const { appSlug, build, buildSlug } = test.context;
  test.is(build.appSlug, appSlug);
  test.is(build.buildSlug, buildSlug);
});

test('describing a build returns the build attributes', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const stub = stubGetBuild({ axios: client, appSlug, buildSlug });

  const description = await build.describe();
  test.deepEqual(description, stub.build);
});

test('checking if the build has finished returns false if there is no finish time', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const stub = stubGetBuild({ axios: client, appSlug, buildSlug });
  stub.build.finished_at = null;
  test.false(await build.isFinished());
});

test('checking if the build has finished returns true if there is a finish time', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const stub = stubGetBuild({ axios: client, appSlug, buildSlug });
  stub.build.finished_at = DateTime.utc().toISO();
  test.true(await build.isFinished());
});

test.serial('following a successful build that has not finished prints the log output', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;

  const logChunks = [
    'line one',
    'line two',
    'line three'
  ];

  const buildStub = stubGetBuild({ appSlug, axios: client, buildSlug });
  buildStub.build.status = 1;
  stubBuildLogStream({ appSlug, axios: client, buildSlug, logChunks });

  // Cause timers to execute immediately
  const clock = sinon.stub(global, 'setTimeout').callsArg(0);
  const write = sinon.stub(process.stdout, 'write');

  try {
    await build.follow();

    for (const chunk of logChunks) {
      sinon.assert.calledWithExactly(write, chunk);
    }
  } finally {
    clock.restore();
    write.restore();
  }
});

test.serial('following a failed build that has not finished prints the log output and then errors', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;

  const logChunks = [
    'line one',
    'line two',
    'line three'
  ];

  const buildStub = stubGetBuild({ appSlug, axios: client, buildSlug });
  buildStub.build.status = 2;
  stubBuildLogStream({ appSlug, axios: client, buildSlug, logChunks });

  // Cause timers to execute immediately
  const clock = sinon.stub(global, 'setTimeout').callsArg(0);
  const write = sinon.stub(process.stdout, 'write');

  try {
    await test.throws(build.follow());

    for (const chunk of logChunks) {
      sinon.assert.calledWithExactly(write, chunk);
    }
  } finally {
    clock.restore();
    write.restore();
  }
});

test.serial('following a successful build that has already finished prints the log output', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const logText = 'some log text';

  const buildStub = stubGetBuild({ appSlug, axios: client, buildSlug });
  buildStub.build.status = 1;
  stubArchivedBuildLog({ appSlug, axios: client, buildSlug, logText });

  const write = sinon.stub(process.stdout, 'write');

  try {
    await build.follow();
    sinon.assert.calledWithExactly(write, logText);
  } finally {
    write.restore();
  }
});

test('following a failed build that has already finished prints the log output and then errors', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const logText = 'some log text';

  const buildStub = stubGetBuild({ appSlug, axios: client, buildSlug });
  buildStub.build.status = 2;
  stubArchivedBuildLog({ appSlug, axios: client, buildSlug, logText });

  const write = sinon.stub(process.stdout, 'write');

  try {
    await test.throws(build.follow());
    sinon.assert.calledWithExactly(write, logText);
  } finally {
    write.restore();
  }
});

test('a build can be aborted', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const stub = stubAbortBuild({ appSlug, axios: client, buildSlug });
  await build.abort();
  sinon.assert.calledWithExactly(stub, sinon.match.string);
});

test('a build can be aborted with a reason', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const reason = uuid();
  const stub = stubAbortBuild({ appSlug, axios: client, buildSlug });
  await build.abort({ reason });
  sinon.assert.calledWithExactly(
    stub,
    sinon.match.string,
    sinon.match({ abort_reason: reason })
  );
});
