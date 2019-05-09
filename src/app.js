const build = require('./build');
const isNil = require('lodash/isNil');
const negate = require('lodash/negate');
const pickBy = require('lodash/pickBy');
const project = require('../package.json');

const buildEnvironment = (environment) => {
  if (!environment) {
    return null;
  }

  const environments = [];
  for (const [ name, value ] of Object.entries(environment)) {
    environments.push({ mapped_to: name, value });
  }
  return environments;
};

const buildParameters = (
  { branch, tag, commitHash, commitMessage, disableStatusReporting, environment, pullRequest, target, workflow }
) => pickBy(
  {
    branch: branch || 'master',
    tag: tag,
    branch_dest: target,
    commit_hash: commitHash,
    commit_message: commitMessage,
    environments: buildEnvironment(environment),
    pull_request_id: pullRequest,
    skip_git_status_report: disableStatusReporting,
    workflow_id: workflow
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

module.exports = ({ client, slug }) => {
  const app = { slug };
  app.triggerBuild = triggerBuild.bind(app, { client, slug });
  return app;
};
