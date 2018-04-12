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

  it('recognizes mobile', () => {
    expect(util.isMobile()).toEqual(false);
    expect(util.isMobile('')).toEqual(false);
    expect(util.isMobile('Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25')).toEqual(true);
    expect(util.isMobile('Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36')).toEqual(true);
    expect(util.isMobile('Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en-US) AppleWebKit/534.8+ (KHTML, like Gecko) Version/6.0.0.450 Mobile Safari/534.8+')).toEqual(true);
  });

  it('knows how much you hate the mobile site', () => {
    expect(util.hatesMobileSite()).toEqual(false);
    expect(util.hatesMobileSite('https://beta.prx.org/what/ever')).toEqual(true);
    expect(util.hatesMobileSite('http://listen.prx.org/what/ever')).toEqual(true);
    expect(util.hatesMobileSite(null, {m: '0'})).toEqual(true);
    expect(util.hatesMobileSite(null, {m: 0})).toEqual(true);
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
