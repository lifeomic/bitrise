const isNil = require('lodash/isNil');
const negate = require('lodash/negate');
const pickBy = require('lodash/pickBy');
const queryString = require('query-string');
const artifact = require('./artifact');

const abortBuild = async ({ appSlug, buildSlug, client }, options = {}) => {
  if (options.reason) {
    const params = pickBy(
      {
        abort_reason: options.reason,
        abort_with_success: options.withSuccess,
        skip_notifications: options.skipNotifications
      },
      negate(isNil)
    );
    await client.post(`/apps/${appSlug}/builds/${buildSlug}/abort`, params);
    return;
  }

  await client.post(`/apps/${appSlug}/builds/${buildSlug}/abort`);
};

const describeBuild = async ({ appSlug, buildSlug, client }) => {
  const response = await client.get(`/apps/${appSlug}/builds/${buildSlug}`);
  return response.data.data;
};

const followBuild = async ({ appSlug, buildSlug, client }, options = {}) => {
  let lastActive = Date.now();
  let timestamp;
  let attributes;
  let lastPosition = 0;
  // Start with the interval provided, or the default, but if the build
  // completes then the interval will be dropped to 0 to pull logs as fast
  // as possible
  let interval = options.interval || 5000;
  do {
    if (timestamp && interval > 0) {
      await sleep(interval);
    }

    const parameters = timestamp ? `?timestamp=${timestamp}` : '';
    const response = await client.get(
      `/apps/${appSlug}/builds/${buildSlug}/log${parameters}`
    );

    // If the log has already been archived then polling is no good. Just
    // download and print the log data. This handles the case where the
    // very first request finds an archived build
    if (response.data.is_archived && !timestamp) {
      const archiveResponse = await client.get(
        response.data.expiring_raw_log_url
      );
      process.stdout.write(archiveResponse.data);
      break;
    }

    const now = Date.now();
    if (response.data.log_chunks.length) {
      response.data.log_chunks.forEach(({ chunk, position }) => {
        // When requesting the logs by timestamps returned from previous
        // requests, duplicate chunks are included in the response. Only
        // log new chunks
        if (position > lastPosition) {
          process.stdout.write(chunk);
          lastPosition = position;
        }
      }
      );
      lastActive = now;
    } else if (options.heartbeat && now - lastActive >= options.heartbeat) {
      process.stdout.write('heartbeat: waiting for build output...\n');
      lastActive = now;
    }

    // Sometimes build might have empty log_chunks, have is_archived set to false, have non-empty timestamp, but be aborted
    // (because of bitrise timeout for example). Don't follow such builds forever:
    attributes = await describeBuild({ appSlug, buildSlug, client });
    if (attributes.status === 3 && !response.data.is_archived && response.data.log_chunks.length === 0) {
      process.stdout.write('Build has been aborted, not polling logs any more\n');
      throw new Error(`Build ${appSlug}/${buildSlug} aborted`);
    }

    // If the build is completed and there are no more log chunks
    if (attributes.finished_at) {
      if (response.data.log_chunks.length === 0) {
        // No need to keep watching a completed build
        break;
      }

      // If the build is done and chuncks are being seeing, then pull them
      // as fast as possible
      interval = 0;
    }

    // If the log was being followed and it switched to streaming before the
    // end was hit, then end early and warn about missing logs
    if (response.data.is_archived) {
      process.stdout.write('Build has been archived before all the logs were streamed. Check the Bitrise console for the full logs\n');
      break;
    }

    timestamp = response.data.timestamp;
  } while (timestamp);
  if (!attributes) {
    attributes = await describeBuild({ appSlug, buildSlug, client });
  }
  if (attributes.status > 1) {
    throw new Error(`Build ${appSlug}/${buildSlug} failed`);
  }
};

const listArtifacts = async ({ appSlug, buildSlug, client }, options = {}) => {
  const query = queryString.stringify(options);
  const queryPart = query ? `?${query}` : '';

  const response = await client.get(`/apps/${appSlug}/builds/${buildSlug}/artifacts${queryPart}`);
  const artifacts = response.data.data.map((artifactDescription) => {
    const artifactSlug = artifactDescription.slug;
    return artifact({ appSlug, buildSlug, client, artifactSlug });
  });

  return {
    artifacts,
    paging: response.data.paging
  };
};

const isFinished = async ({ appSlug, buildSlug, client }) => {
  const attributes = await describeBuild({ appSlug, buildSlug, client });
  return !!attributes.finished_at;
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

module.exports = ({ appSlug, buildSlug, client, buildInfo }) => {
  const build = { appSlug, buildSlug, ...buildInfo };
  const state = { appSlug, buildSlug, client };

  build.abort = abortBuild.bind(build, state);
  build.describe = describeBuild.bind(build, state);
  build.listArtifacts = listArtifacts.bind(build, state);
  build.follow = followBuild.bind(build, state);
  build.isFinished = isFinished.bind(build, state);

  return build;
};
