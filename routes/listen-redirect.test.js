'use strict';

const redirect = require('./listen-redirect');
const makeTester = (loggedIn, isCrawler, isMobile, hatesBeta) => {
  return path => {
    return redirect.some(r => r.test(path, loggedIn, isCrawler, isMobile, hatesBeta));
  };
};

describe('listen-redirect', () => {

  it('redirects non logged in users to pieces only', () => {
    const tester = makeTester(false, false, false, false);
    expect(tester('/pieces/1234')).toEqual(true);
    expect(tester('/accounts/1234')).toEqual(false);
    expect(tester('/group_accounts/1234')).toEqual(false);
    expect(tester('/individual_accounts/1234')).toEqual(false);
    expect(tester('/station_accounts/1234')).toEqual(false);
    expect(tester('/users/1234')).toEqual(false);
  });

  it('does not redirect logged in users', () => {
    const tester = makeTester(true, false, false, false);
    expect(tester('/pieces/1234')).toEqual(false);
    expect(tester('/accounts/1234')).toEqual(false);
    expect(tester('/group_accounts/1234')).toEqual(false);
    expect(tester('/individual_accounts/1234')).toEqual(false);
    expect(tester('/station_accounts/1234')).toEqual(false);
    expect(tester('/users/1234')).toEqual(false);
  });

  it('does not redirect crawlers', () => {
    const tester = makeTester(false, true, false, false);
    expect(tester('/pieces/1234')).toEqual(false);
    expect(tester('/accounts/1234')).toEqual(false);
    expect(tester('/group_accounts/1234')).toEqual(false);
    expect(tester('/individual_accounts/1234')).toEqual(false);
    expect(tester('/station_accounts/1234')).toEqual(false);
    expect(tester('/users/1234')).toEqual(false);
  });

  it('redirects mobile users for most pages', () => {
    const tester = makeTester(false, false, true, false);
    expect(tester('/pieces/1234')).toEqual(true);
    expect(tester('/accounts/1234')).toEqual(true);
    expect(tester('/group_accounts/1234')).toEqual(true);
    expect(tester('/individual_accounts/1234')).toEqual(true);
    expect(tester('/station_accounts/1234')).toEqual(true);
    expect(tester('/users/1234')).toEqual(true);
  });

  it('does not redirect users coming from beta', () => {
    const tester = makeTester(false, false, true, true);
    expect(tester('/pieces/1234')).toEqual(false);
    expect(tester('/accounts/1234')).toEqual(false);
    expect(tester('/group_accounts/1234')).toEqual(false);
    expect(tester('/individual_accounts/1234')).toEqual(false);
    expect(tester('/station_accounts/1234')).toEqual(false);
    expect(tester('/users/1234')).toEqual(false);
  });

});
