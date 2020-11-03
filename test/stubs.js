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

const generateArtifact = (options = {}) => ({
  artifact_meta: {},
  artifact_type: 'android-apk',
  expiring_download_url: `https://example.com/downloads/${uuid()}`,
  file_size_bytes: 100,
  is_public_page_enabled: true,
  public_install_page_url: `https://example.com/install/${uuid()}`,
  slug: options.artifactSlug,
  title: `Artifact ${uuid()}`
});

const unmatchedRequest = async (...args) => {
  throw new Error(
    `Failed to match request with arguments: ${JSON.stringify(args, null, 2)}`
  );
};

exports.stubAbortBuild = ({ appSlug, axios, buildSlug }) => {
  const stub = getStub(axios, 'post');

  stub.withArgs(`/apps/${appSlug}/builds/${buildSlug}/abort`).resolves({
    data: { status: 'ok' },
    status: 200
  });

  return stub;
};

exports.stubArchivedBuildLog = ({ appSlug, axios, buildSlug, logText }) => {
  const logUrl = 'http://localhost/logs/example.txt';
  const stub = getStub(axios, 'get');

  stub.withArgs(`/apps/${appSlug}/builds/${buildSlug}/log`).resolves({
    data: {
      expiring_raw_log_url: logUrl,
      is_archived: true
    },
    status: 200
  });

  stub.withArgs(logUrl).resolves({
    data: logText,
    status: 200
  });
};

exports.stubEmptyNonArchivedBuildLog = ({ appSlug, axios, buildSlug }) => {
  const logUrl = 'http://localhost/logs/example.txt';
  const stub = getStub(axios, 'get');

  stub.withArgs(`/apps/${appSlug}/builds/${buildSlug}/log`).resolves({
    data: {
      expiring_raw_log_url: logUrl,
      is_archived: false,
      log_chunks: []
    },
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

    logStub.withArgs(logUrl).resolves({
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

exports.stubGetArtifact = ({ appSlug, axios, buildSlug, artifactSlug }) => {
  const artifact = generateArtifact({ appSlug, buildSlug, artifactSlug });

  const stub = getStub(axios, 'get')
    .withArgs(`/apps/${appSlug}/builds/${buildSlug}/artifacts/${artifactSlug}`)
    .resolves({
      data: { data: artifact },
      status: 200
    });

  stub.artifact = artifact;
  return stub;
};

exports.stubTriggerBuild = ({ appSlug, axios, body }) => {
  const build = generateBuild();

  const args = [`/apps/${appSlug}/builds`];
  if (body) args.push(body);

  const stub = getStub(axios, 'post')
    .withArgs(...args)
    .resolves({
      data: build,
      status: 200
    });

  stub.build = build;
  return stub;
};

exports.stubListBuilds = ({ appSlug, axios, next }) => {
  const build1 = generateBuild();
  const build2 = generateBuild();

  const urlParts = [`/apps/${appSlug}/builds`];
  if (next) {
    urlParts.push(`?next=${next}`);
  }
  const url = urlParts.join('');

  const stub = getStub(axios, 'get')
    .withArgs(url)
    .resolves({
      data: {
        data: [
          { slug: build1.build_slug },
          { slug: build2.build_slug }
        ],
        paging: {
          page_item_limit: 2,
          total_item_count: 2
        }
      },
      status: 200
    });

  stub.builds = [build1, build2];
  return stub;
};

exports.stubListArtifacts = ({ appSlug, buildSlug, axios, next }) => {
  const artifact1 = generateArtifact();
  const artifact2 = generateArtifact();

  const urlParts = [`/apps/${appSlug}/builds/${buildSlug}/artifacts`];
  if (next) {
    urlParts.push(`?next=${next}`);
  }
  const url = urlParts.join('');

  const stub = getStub(axios, 'get')
    .withArgs(url)
    .resolves({
      data: {
        data: [
          { slug: artifact1.slug },
          { slug: artifact2.slug }
        ],
        paging: {
          page_item_limit: 2,
          total_item_count: 2
        }
      },
      status: 200
    });

  stub.artifacts = [artifact1, artifact2];
  return stub;
};
