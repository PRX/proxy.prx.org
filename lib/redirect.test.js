'use strict';

const Redirect = require('./redirect');

describe('redirect', () => {

  const redirect = new Redirect('foo.bar.gov');

  it('returns a redirect', () => {
    const resp = redirect.redirect({path: '/hello/world'});
    expect(resp.statusCode).toEqual(302);
    expect(resp.headers['content-type']).toEqual('text/plain');
    expect(resp.headers.location).toEqual('https://foo.bar.gov/hello/world');
    expect(resp.body).toEqual('Moved to https://foo.bar.gov/hello/world');
  });

  it('adds query params', () => {
    const resp = redirect.redirect({path: '/hello/world', queryStringParameters: {foo: 'bar%'}});
    expect(resp.statusCode).toEqual(302);
    expect(resp.headers.location).toEqual('https://foo.bar.gov/hello/world?foo=bar%25');
  });

  it('recognizes blank query params', () => {
    const resp = redirect.redirect({path: '/', queryStringParameters: {foo: '1', bar: '', one: ''}});
    expect(resp.statusCode).toEqual(302);
    expect(resp.headers.location).toEqual('https://foo.bar.gov/?foo=1&bar&one');
  });

  it('can be non-https', () => {
    const redirect2 = new Redirect('foo.bar.gov', false);
    const resp = redirect2.redirect({path: '/hello/world'});
    expect(resp.statusCode).toEqual(302);
    expect(resp.headers.location).toEqual('http://foo.bar.gov/hello/world');
  });

  it('rewrites a path', () => {
    const resp = redirect.redirect({path: '/hello/world'}, /Hello/i, 'foobar');
    expect(resp.statusCode).toEqual(302);
    expect(resp.headers.location).toEqual('https://foo.bar.gov/foobar/world');
  });

});
