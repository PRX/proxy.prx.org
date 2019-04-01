'use strict';

const util = require('./util');

/**
 * Return a redirect
 */
module.exports = class Redirect {

  constructor(host, rewrite, useHttps = true) {
    this.host = host;
    this.rewrite = rewrite;
    this.protocol = useHttps ? 'https' : 'http';
  }

  request(event) {
    if (this.rewrite) {
      return this.rewrite(event.path).then(newPath => {
        return this._request(event, newPath);
      });
    } else {
      return this._request(event, event.path);
    }
  }

  _request(event, path) {
    const query = util.queryToString(event.queryStringParameters);
    const loc = this._location(path, query);
    return Promise.resolve({
      statusCode: 302,
      headers: {'location': loc, 'content-type': 'text/plain', },
      body: `Moved to ${loc}`
    });
  }

  _location(path, query) {
    if (this.host) {
      return `${this.protocol}://${this.host}${path || ''}${query}`;
    } else {
      return `${path || ''}${query}`;
    }
  }

}
