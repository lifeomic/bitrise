const axios = require('axios');
const build = require('../src/build');
const sinon = require('sinon');
const test = require('ava');
const uuid = require('uuid/v4');

const { DateTime } = require('luxon');
const { stubAbortBuild, stubArchivedBuildLog, stubBuildLogStream, stubGetBuild, stubListArtifacts } = require('./stubs');

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
      sinon.assert.calledWithExactly(clock, sinon.match.func, 5000);
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

test.serial('following a build can customize the polling interval', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const interval = 1000;

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
    await build.follow({ interval });
    sinon.assert.calledWithExactly(clock, sinon.match.func, interval);
  } finally {
    clock.restore();
    write.restore();
  }
});

test.serial('a heartbeat can be emitted when a followed build has no new output', async (test) => {
  const { appSlug, build, buildSlug, client } = test.context;
  const heartbeat = 10000;

  const logChunks = [
    'line one', // 0s
    null, // 5s
    null, // 10s
    'line two', // 15s
    'line three', // 20s
    null, // 25s
    null, // 30s
    null, // 35s
    'line four' // 40s
  ];

  const buildStub = stubGetBuild({ appSlug, axios: client, buildSlug });
  buildStub.build.status = 1;
  stubBuildLogStream({ appSlug, axios: client, buildSlug, logChunks });

  let currentNow = 0;
  const tick = () => {
    const oldNow = currentNow;
    currentNow += 5000;
    return oldNow;
  };

  // Cause timers to execute immediately
  const clock = sinon.stub(global, 'setTimeout').callsArg(0);
  const now = sinon.stub(Date, 'now').callsFake(tick);
  const write = sinon.stub(process.stdout, 'write');

  try {
    await build.follow({ heartbeat });
    test.deepEqual(
      write.args,
      [
        [ 'line one' ],
        [ 'heartbeat: waiting for build output...\n' ],
        [ 'line two' ],
        [ 'line three' ],
        [ 'heartbeat: waiting for build output...\n' ],
        [ 'line four' ]
      ]
    );
  } finally {
    clock.restore();
    now.restore();
    write.restore();
  }
});

test('an build can list artifacts', async (test) => {
  const { build, client, appSlug, buildSlug } = test.context;
  const stub = stubListArtifacts({ appSlug, buildSlug, axios: client });

  const artifactList = await build.listArtifacts();
  test.is(artifactList.artifacts.length, 2);
  test.is(artifactList.artifacts[0].appSlug, appSlug);
  test.is(artifactList.artifacts[0].buildSlug, buildSlug);
  test.is(artifactList.artifacts[0].artifactSlug, stub.artifacts[0].slug);
  test.is(artifactList.artifacts[1].appSlug, appSlug);
  test.is(artifactList.artifacts[1].buildSlug, buildSlug);
  test.is(artifactList.artifacts[1].artifactSlug, stub.artifacts[1].slug);
});

test('a build can list a second page of artifacts', async (test) => {
  const { build, client, appSlug, buildSlug } = test.context;
  const next = uuid();
  const stub = stubListArtifacts({ appSlug, buildSlug, axios: client, next });

  const artifactList = await build.listArtifacts({ next });
  test.is(artifactList.artifacts.length, 2);
  test.is(artifactList.artifacts[0].appSlug, appSlug);
  test.is(artifactList.artifacts[0].buildSlug, buildSlug);
  test.is(artifactList.artifacts[0].artifactSlug, stub.artifacts[0].slug);
  test.is(artifactList.artifacts[1].appSlug, appSlug);
  test.is(artifactList.artifacts[1].buildSlug, buildSlug);
  test.is(artifactList.artifacts[1].artifactSlug, stub.artifacts[1].slug);
});
