'use strict';

const nock = require('nock');
const Proxy = require('./proxy');

describe('proxy', () => {

  const proxy = new Proxy('foo.bar');

  it('returns the proxied resource', () => {
    nock('https://foo.bar').get('/thing').reply(200, 'what ever', {'Header': 'value'});
    return proxy.request({httpMethod: 'GET', path: '/thing', headers: {}}).then(resp => {
      expect(resp.method).toEqual('GET');
      expect(resp.path).toEqual('/thing');
      expect(resp.status).toEqual(200);
      expect(resp.headers).toEqual({header: 'value'});
      expect(Buffer.from(resp.body, 'base64').toString()).toEqual('what ever');
    });
  });

  it('rewrites paths', () => {
    nock('https://foo.bar').get('/hello/world').reply(200, 'hello world');
    const event = {httpMethod: 'GET', path: '/thing', headers: {}};
    return proxy.request(event, /thing/, 'hello/world').then(resp => {
      expect(resp.method).toEqual('GET');
      expect(resp.path).toEqual('/hello/world');
      expect(resp.originalPath).toEqual('/thing');
      expect(resp.status).toEqual(200);
      expect(resp.headers).toEqual({});
      expect(Buffer.from(resp.body, 'base64').toString()).toEqual('hello world');
    });
  });

  it('passes query params', () => {
    nock('https://foo.bar')
      .get('/thing')
      .query(obj => {
        expect(obj.hello).toEqual('world')
        expect(obj.foo).toEqual('')
        return true;
      })
      .reply(200, 'what ever');
    const event = {httpMethod: 'GET', path: '/thing', headers: {}, queryStringParameters: {hello: 'world', foo: ''}};
    return proxy.request(event).then(resp => {
      expect(resp.path).toEqual('/thing?hello=world&foo');
    });
  });

  it('passes request headers', () => {
    nock('https://foo.bar', {reqheaders: {'foo': 'bar'}}).get('/thing').reply(200, 'what ever');
    const event = {httpMethod: 'GET', path: '/thing', headers: {'Foo': 'bar'}};
    return proxy.request(event).then(resp => {
      expect(resp.path).toEqual('/thing');
    });
  });

});
