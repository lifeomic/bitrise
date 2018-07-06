const build = require('./build');
const project = require('../package.json');

const buildParameters = ({ commitHash, workflow }) => {
  const parameters = {};

  if (commitHash) {
    parameters.commit_hash = commitHash;
  } else {
    parameters.branch = 'master';
  }

  if (workflow) {
    parameters.workflow_id = workflow;
  }

  return parameters;
};

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
