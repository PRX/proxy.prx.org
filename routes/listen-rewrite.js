'use strict';

const https = require('https');
const CMS_HOST = process.env.CMS_HOST || 'cms.prx.org';

const PIECES = /^\/pieces\//;
const ACCOUNTS = /^\/([a-z]+_)?accounts\//;
const USERS = /^\/users\/([0-9]+)/;

/**
 * Rewrite piece/account paths
 */
module.exports = (path) => {
  if (PIECES.test(path)) {
    return Promise.resolve(path.replace(PIECES, '/stories/'));
  } else if (ACCOUNTS.test(path)) {
    return Promise.resolve(path.replace(ACCOUNTS, '/accounts/'));
  } else if (USERS.test(path)) {
    const userId = path.match(USERS)[1];
    return cmsGet(`/api/v1/users/${userId}?zoom=prx:default-account`).then(json => {
      const defaultAccount = json['_links']['prx:default-account']['href'];
      const accountId = defaultAccount.split('/').pop();
      return `/accounts/${accountId}`;
    }).catch(err => {
      return path;
    });
  } else {
    return Promise.resolve(path);
  }
};

/**
 * Get some CMS data
 */
function cmsGet(path) {
  return new Promise((resolve, reject) => {
    const url = `https://${CMS_HOST}${path}`;
    https.get(url, resp => {
      if (resp.statusCode === 200) {
        let data = [];
        resp.on('data', chunk => data.push(chunk));
        resp.on('end', () => {
          const buffer = Buffer.concat(data).toString('utf-8');
          try {
            resolve(JSON.parse(buffer));
          } catch (err) {
            reject(new Error('Invalid response json'));
          }
        });
      } else {
        reject(new Error(`Got ${resp.statusCode} for url: ${url}`));
      }
    }).on('error', err => reject(err));
  });
}
