'use strict';

const nock = require('nock');
const Proxy = require('./proxy');

describe('proxy', () => {

  const rewrite = path => Promise.resolve(path === '/re/write' ? '/re/written' : path);
  const proxy = new Proxy('foo.bar', rewrite);

  it('returns the proxied resource', () => {
    nock('https://foo.bar').get('/thing').reply(200, 'what ever', {'Header': 'value'});
    return proxy.request({httpMethod: 'GET', path: '/thing', headers: {}}).then(resp => {
      expect(resp.statusCode).toEqual(200);
      expect(resp.headers).toEqual({header: 'value'});
      expect(resp.isBase64Encoded).toEqual(true);
      expect(Buffer.from(resp.body, 'base64').toString()).toEqual('what ever');
    });
  });

  it('rewrites paths', () => {
    nock('https://foo.bar').get('/re/written').reply(200, 'hello world');
    const event = {httpMethod: 'GET', path: '/re/write', headers: {}};
    return proxy.request(event).then(resp => {
      expect(resp.statusCode).toEqual(200);
      expect(resp.headers).toEqual({});
      expect(resp.isBase64Encoded).toEqual(true);
      expect(Buffer.from(resp.body, 'base64').toString()).toEqual('hello world');
    });
  });

  it('passes query params', () => {
    const scope = nock('https://foo.bar')
      .get('/thing')
      .query(obj => {
        expect(obj.hello).toEqual('world')
        expect(obj.foo).toEqual('')
        return true;
      })
      .reply(200, 'what ever');
    const event = {httpMethod: 'GET', path: '/thing', headers: {}, queryStringParameters: {hello: 'world', foo: ''}};
    return proxy.request(event).then(resp => {
      expect(scope.isDone()).toEqual(true);
    });
  });

  it('passes request headers', () => {
    const scope = nock('https://foo.bar', {reqheaders: {'foo': 'bar'}}).get('/thing').reply(200, 'what ever');
    const event = {httpMethod: 'GET', path: '/thing', headers: {'Foo': 'bar'}};
    return proxy.request(event).then(resp => {
      expect(scope.isDone()).toEqual(true);
    });
  });

  it('retries with a backoff', () => {
    jest.spyOn(proxy, 'retries').mockImplementation(i => [10, 20, 100][i]);
    jest.spyOn(console, 'warn').mockImplementation(() => null);

    nock('https://foo.bar').get('/thing').delay(20).reply(200, 'resp1');
    nock('https://foo.bar').get('/thing').delay(40).reply(200, 'resp2');
    nock('https://foo.bar').get('/thing').delay(10).reply(200, 'resp3');

    return proxy.request({httpMethod: 'GET', path: '/thing', headers: {}}).then(resp => {
      expect(resp.statusCode).toEqual(200);
      expect(Buffer.from(resp.body, 'base64').toString()).toEqual('resp3');
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn.mock.calls[0][0]).toMatch(/timed out after 10ms/i);
      expect(console.warn.mock.calls[1][0]).toMatch(/timed out after 20ms/i);
    });
  });

});
