const axios = require('axios');
const client = require('..');
const sinon = require('sinon');
const test = require('ava');
const uuid = require('uuid/v4');

test('an api token is required', (test) => {
  test.throws(() => client());
  test.throws(() => client({}));
  test.truthy(client({ token: uuid() }));
});

test.serial('a client is authenticated', (test) => {
  const create = sinon.stub(axios, 'create');
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
  const axiosInstance = { post: sinon.stub().rejects(new Error('fake')) };
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
