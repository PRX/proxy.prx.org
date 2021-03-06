'use strict';

const Redirect = require('./redirect');

describe('redirect', () => {

  const rewrite = path => Promise.resolve(path === '/re/write' ? '/re/written' : path);
  const redirect = new Redirect('foo.bar.gov', rewrite);
  const redirect301 = new Redirect('foo.bar.gov', rewrite, true, 301);

  it('returns a redirect', () => {
    return redirect.request({path: '/hello/world'}).then(resp => {
      expect(resp.statusCode).toEqual(302);
      expect(resp.headers['content-type']).toEqual('text/plain');
      expect(resp.headers.location).toEqual('https://foo.bar.gov/hello/world');
      expect(resp.body).toEqual('Moved to https://foo.bar.gov/hello/world');
    });
  });

  it('returns a 301 redirect', () => {
    return redirect301.request({path: '/hello/world'}).then(resp => {
      expect(resp.statusCode).toEqual(301);
      expect(resp.headers['content-type']).toEqual('text/plain');
      expect(resp.headers.location).toEqual('https://foo.bar.gov/hello/world');
      expect(resp.body).toEqual('Moved to https://foo.bar.gov/hello/world');
    });
  });

  it('adds query params', () => {
    return redirect.request({path: '/hello/world', queryStringParameters: {foo: 'bar%'}}).then(resp => {
      expect(resp.statusCode).toEqual(302);
      expect(resp.headers.location).toEqual('https://foo.bar.gov/hello/world?foo=bar%25');
    });
  });

  it('recognizes blank query params', () => {
    return redirect.request({path: '/', queryStringParameters: {foo: '1', bar: '', one: ''}}).then(resp => {
      expect(resp.statusCode).toEqual(302);
      expect(resp.headers.location).toEqual('https://foo.bar.gov/?foo=1&bar&one');
    });
  });

  it('can be non-https', () => {
    const redirect2 = new Redirect('foo.bar.gov', null, false);
    return redirect2.request({path: '/hello/world'}).then(resp => {
      expect(resp.statusCode).toEqual(302);
      expect(resp.headers.location).toEqual('http://foo.bar.gov/hello/world');
    });
  });

  it('rewrites a path', () => {
    return redirect.request({path: '/re/write'}, /Hello/i, 'foobar').then(resp => {
      expect(resp.statusCode).toEqual(302);
      expect(resp.headers.location).toEqual('https://foo.bar.gov/re/written');
    });
  });

});
