'use strict';

const util = require('./util');

describe('util', () => {

  it('recognizes logged in users', () => {
    expect(util.isLoggedIn()).toEqual(false);
    expect(util.isLoggedIn('')).toEqual(false);
    expect(util.isLoggedIn('_hello=world; foo=bar')).toEqual(false);
    expect(util.isLoggedIn('_hello=world; _prx_session=anything; foo=bar')).toEqual(true);
  });

  it('recognizes crawlers', () => {
    expect(util.isCrawler()).toEqual(false);
    expect(util.isCrawler('')).toEqual(false);
    expect(util.isCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toEqual(true);
    expect(util.isCrawler('Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toEqual(true);
  });

  it('lowercases keys', () => {
    expect(util.keysToLowerCase()).toEqual(undefined);
    expect(util.keysToLowerCase({})).toEqual({});
    expect(util.keysToLowerCase({HELLO: '1'}).hello).toEqual('1');
    expect(util.keysToLowerCase({hello: '1'}).hello).toEqual('1');
    expect(util.keysToLowerCase({heLlo: '1'}).hello).toEqual('1');
  });

  it('mixed-cases keys with multiple values', () => {
    const vals = util.keysToLowerCase({HELLO: ['1', '2', '3']});
    expect(Object.keys(vals).length).toEqual(3);
    expect(Object.keys(vals)).toEqual(['hello', 'Hello', 'hEllo']);
  });

});
