const get = require('lodash/get');
const sinon = require('sinon');
const uuid = require('uuid/v4');

const getStub = (subject, method) => {
  const stub = get(subject, method);

  if (stub.withArgs) {
    return stub;
  }

  return sinon.stub(subject, method).callsFake(unmatchedRequest);
};

const generateBuild = (options = {}) => ({
  build_slug: options.buildSlug || uuid(),
  slug: options.appSlug || uuid(),
  status: 0
});

const unmatchedRequest = async (...args) => {
  throw new Error(`Failed to match request with arguments: ${JSON.stringify(args, null, 2)}`);
};

exports.stubAbortBuild = ({ appSlug, axios, buildSlug }) => {
  const stub = getStub(axios, 'post');

  stub.withArgs(`/apps/${appSlug}/builds/${buildSlug}/abort`)
    .resolves({
      data: { status: 'ok' },
      status: 200
    });

  return stub;
};

exports.stubArchivedBuildLog = ({ appSlug, axios, buildSlug, logText }) => {
  const logUrl = 'http://localhost/logs/example.txt';
  const stub = getStub(axios, 'get');

  stub.withArgs(`/apps/${appSlug}/builds/${buildSlug}/log`)
    .resolves({
      data: {
        expiring_raw_log_url: logUrl,
        is_archived: true
      },
      status: 200
    });

  stub.withArgs(logUrl)
    .resolves({
      data: logText,
      status: 200
    });
};

exports.stubBuildLogStream = ({ appSlug, axios, buildSlug, logChunks }) => {
  const logStub = getStub(axios, 'get');

  const chunks = logChunks.slice();
  let timestamp = 1;

  while (chunks.length) {
    const chunk = chunks.shift();
    const parameters = timestamp > 1 ? `?timestamp=${timestamp - 1}` : '';
    const logUrl = `/apps/${appSlug}/builds/${buildSlug}/log${parameters}`;

    logStub.withArgs(logUrl)
      .resolves({
        data: {
          is_archived: chunks.length === 0,
          log_chunks: chunk
            ? [
              {
                chunk,
                position: timestamp
              }
            ]
            : [],
          timestamp: chunks.length ? timestamp : null
        },
        status: 200
      });

    timestamp++;
  }
};

exports.stubGetBuild = ({ appSlug, axios, buildSlug }) => {
  const build = generateBuild({ appSlug, buildSlug });

  const stub = getStub(axios, 'get')
    .withArgs(`/apps/${appSlug}/builds/${buildSlug}`)
    .resolves({
      data: { data: build },
      status: 200
    });

  stub.build = build;
  return stub;
};

exports.stubTriggerBuild = ({ appSlug, axios }) => {
  const build = generateBuild();

  const stub = getStub(axios, 'post')
    .withArgs(`/apps/${appSlug}/builds`)
    .resolves({
      data: build,
      status: 200
    });

  stub.build = build;
  return stub;
};
