'use strict';

const Redirect = require('./redirect');

describe('redirect', () => {

  const rewrite = path => Promise.resolve(path === '/re/write' ? '/re/written' : path);
  const redirect = new Redirect('foo.bar.gov', rewrite);

  it('returns a redirect', () => {
    return redirect.request({path: '/hello/world'}).then(resp => {
      expect(resp.statusCode).toEqual(302);
      expect(resp.headers['content-type']).toEqual('text/plain');
      expect(resp.headers.location).toEqual('https://foo.bar.gov/hello/world');
      expect(resp.body).toEqual('Moved to https://foo.bar.gov/hello/world');
    });
  });

  it('returns a relative redirect', () => {
    const redirect2 = new Redirect(null, rewrite);
    return redirect2.request({path: '/re/write'}).then(resp => {
      expect(resp.statusCode).toEqual(302);
      expect(resp.headers['content-type']).toEqual('text/plain');
      expect(resp.headers.location).toEqual('/re/written');
      expect(resp.body).toEqual('Moved to /re/written');
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
