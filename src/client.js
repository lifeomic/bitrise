const app = require('./app');
const assert = require('assert');
const axios = require('axios');
const axiosRetry = require('axios-retry');

const createClient = ({ token }) => {
  assert(token, 'An access token is required');

  const client = axios.create({
    baseURL: 'https://api.bitrise.io/v0.1',
    headers: { Authorization: `token ${token}` }
  });

  axiosRetry(client, { retryDelay: axiosRetry.exponentialDelay });

  const instance = {};
  instance.app = ({ slug }) => app({ client, slug });
  return instance;
};

module.exports = createClient;
