const describeArtifact = async ({ appSlug, buildSlug, artifactSlug, client }) => {
  const response = await client.get(`/apps/${appSlug}/builds/${buildSlug}/artifacts/${artifactSlug}`);
  return response.data.data;
};

module.exports = ({ appSlug, buildSlug, artifactSlug, client }) => {
  const artifact = { appSlug, buildSlug, artifactSlug };
  const state = { appSlug, buildSlug, artifactSlug, client };

  artifact.describe = describeArtifact.bind(artifact, state);

  return artifact;
};
