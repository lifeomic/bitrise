const build = require('./build');
const isNil = require('lodash/isNil');
const negate = require('lodash/negate');
const pickBy = require('lodash/pickBy');
const project = require('../package.json');
const queryString = require('query-string');

const buildEnvironment = (environment) => {
  if (!environment) {
    return null;
  }

  const environments = [];
  for (const [name, value] of Object.entries(environment)) {
    environments.push({ mapped_to: name, value });
  }
  return environments;
};

const buildParameters = ({
  target,
  branch,
  commitHash,
  commitMessage,
  environment,
  commitPaths,
  diffUrl,
  pullRequest,
  pullRequestAuthor,
  pullRequestHeadBranch,
  workflow,
  pullRequestMergeBranch,
  pullRequestRepositoryUrl,
  disableStatusReporting,
  tag
}) =>
  pickBy(
    {
      branch: branch || 'master',
      branch_dest: target,
      commit_hash: commitHash,
      commit_message: commitMessage,
      commit_paths: commitPaths,
      diff_url: diffUrl,
      pull_request_author: pullRequestAuthor,
      pull_request_head_branch: pullRequestHeadBranch,
      pull_request_id: pullRequest,
      pull_request_merge_branch: pullRequestMergeBranch,
      pull_request_repository_url: pullRequestRepositoryUrl,
      environments: buildEnvironment(environment),
      skip_git_status_report: disableStatusReporting,
      workflow_id: workflow,
      tag: tag
    },
    negate(isNil)
  );

const triggerBuild = async ({ client, slug }, options = {}) => {
  const buildOptions = {
    build_params: buildParameters(options),
    hook_info: { type: 'bitrise' },
    triggered_by: project.name
  };

  const response = await client.post(`/apps/${slug}/builds`, buildOptions);
  return build({ appSlug: slug, client, buildSlug: response.data.build_slug });
};

const listBuilds = async ({ client, slug }, options = {}) => {
  const query = queryString.stringify(options);
  const queryPart = query ? `?${query}` : '';

  const response = await client.get(`/apps/${slug}/builds${queryPart}`);

  const builds = response.data.data.map((buildInfo) => {
    return build({ appSlug: slug, client, buildSlug: buildInfo.slug });
  });

  return {
    builds,
    paging: response.data.paging
  };
};

module.exports = ({ client, slug }) => {
  const app = { slug };
  app.triggerBuild = triggerBuild.bind(app, { client, slug });
  app.listBuilds = listBuilds.bind(app, { client, slug });
  return app;
};
