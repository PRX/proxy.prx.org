'use strict';

const rewrite = require('./listen-rewrite');
const nock = require('nock');

describe('listen-rewrite', () => {

  test('ignores unknown paths', () => {
    return rewrite('/foo/1234').then(path => {
      expect(path).toEqual('/foo/1234');
    });
  });

  test('rewrites pieces to stories', () => {
    return rewrite('/pieces/1234').then(path => {
      expect(path).toEqual('/stories/1234');
    });
  });

  test('rewrites account types', () => {
    return rewrite('/accounts/123').then(path => {
      expect(path).toEqual('/accounts/123');
      return rewrite('/group_accounts/456');
    }).then(path => {
      expect(path).toEqual('/accounts/456');
      return rewrite('/individual_accounts/789');
    }).then(path => {
      expect(path).toEqual('/accounts/789');
      return rewrite('/station_accounts/101112');
    }).then(path => {
      expect(path).toEqual('/accounts/101112');
    });
  });

  test('rewrites users', async () => {
    return rewrite('/users/1234').then(path => {
      expect(path).toEqual('/users/1234');
    });
  });

});
