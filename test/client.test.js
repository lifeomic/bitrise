const axios = require('axios');
const client = require('..');
const nock = require('nock');
const sinon = require('sinon');
const test = require('ava');
const uuid = require('uuid/v4');

test.beforeEach(() => {
  nock.disableNetConnect();
});

test.afterEach(() => {
  nock.enableNetConnect();
  nock.cleanAll();
});

test.serial('an api token is required', (test) => {
  test.throws(() => client());
  test.throws(() => client({}));
  test.truthy(client({ token: uuid() }));
});

test.serial('a client is authenticated', (test) => {
  const create = sinon.spy(axios, 'create');
  const token = uuid();

  try {
    const instance = client({ token });
    test.truthy(instance);
    sinon.assert.calledOnce(create);
    sinon.assert.calledWithExactly(
      create,
      sinon.match({
        baseURL: 'https://api.bitrise.io/v0.1',
        headers: sinon.match({ Authorization: `token ${token}` })
      })
    );
  } finally {
    create.restore();
  }
});

test.serial('a client can create an app', async (test) => {
  const axiosInstance = axios.create();
  sinon.stub(axiosInstance, 'post').rejects(new Error('fake'));

  const create = sinon.stub(axios, 'create').returns(axiosInstance);
  const slug = uuid();
  const token = uuid();

  try {
    const app = client({ token }).app({ slug });
    test.is(app.slug, slug);

    try {
      await app.triggerBuild();
    } catch (error) {
      // expected error
    }

    sinon.assert.calledOnce(axiosInstance.post);
  } finally {
    create.restore();
  }
});

test.serial('a client retries requests', async (test) => {
  const create = sinon.spy(axios, 'create');
  const token = uuid();

  nock('http://localhost')
    .get('/error').replyWithError('boom')
    .get('/error').reply(500)
    .get('/error').reply(200, 'success!');

  try {
    const instance = client({ token });
    test.truthy(instance);

    sinon.assert.calledOnce(create);
    const httpClient = create.firstCall.returnValue;
    const response = await httpClient.get('http://localhost/error');
    test.is(response.data, 'success!');
  } finally {
    create.restore();
  }
});

test.serial('a client gives up after too many retries', async (test) => {
  const create = sinon.spy(axios, 'create');
  const token = uuid();

  nock('http://localhost')
    .get('/error').replyWithError('boom')
    .get('/error').thrice().reply(500);

  try {
    const instance = client({ token });
    test.truthy(instance);

    sinon.assert.calledOnce(create);
    const httpClient = create.firstCall.returnValue;
    const { response } = await test.throws(httpClient.get('http://localhost/error'));
    test.is(response.status, 500);
  } finally {
    create.restore();
  }
});
