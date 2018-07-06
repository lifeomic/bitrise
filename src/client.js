const app = require('./app');
const assert = require('assert');
const axios = require('axios');

module.exports = ({ token }) => {
  assert(token, 'An access token is required');

  const client = axios.create({
    baseURL: 'https://api.bitrise.io/v0.1',
    headers: { Authorization: `token ${token}` }
  });

  const instance = {};
  instance.app = ({ slug }) => app({ client, slug });
  return instance;
};
