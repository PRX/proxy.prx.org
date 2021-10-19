'use strict';

require('dotenv').config()
const handler = require('./index');
const express = require('express');
const bodyParser = require('body-parser');
const typeis = require('type-is');

const app = express();
const port = process.env.PORT || 3000;

// proxy request body
app.use(bodyParser.raw({type: '*/*'}));

// pretend to be an api-gateway
app.use((req, res) => {
  const event = {
    resource: (req.path === '/') ? '/' : '/{proxy+}',
    path: req.path,
    httpMethod: req.method,
    headers: req.headers || {},
    queryStringParameters: req.query || null,
    pathParameters: (req.path === '/') ? null : {proxy: req.path},
    stageVariables: null,
    requestContext: {},
    body: typeis.hasBody(req) ? req.body.toString('utf-8') : null,
    isBase64Encoded: false
  };
  handler.handler(event, {}, (err, data) => {
    if (err) {
      res.status(500).send(`Lambda Error: ${err}`);
    } else if (!data.statusCode) {
      res.status(500).send(`Lambda returned no statusCode: ${JSON.stringify(data)}`);
    } else {
      if (data.headers && data.headers.location) {
        data.headers.location = data.headers.location.replace(/^http:\/\/localhost\//, `http://localhost:${port}/`);
      }
      res.status(data.statusCode);
      res.set(fixMixedCaseHeaders(data.headers || {}));
      if (data.body && data.isBase64Encoded) {
        const buff = Buffer.from(data.body, 'base64');
        res.send(buff);
      } else if (data.body) {
        res.send(data.body);
      } else {
        res.end();
      }
    }
  });
});

// undo our api-gateway headers hack
function fixMixedCaseHeaders(headers) {
  let result = {};
  Object.keys(headers).forEach(k => {
    const key = k.toLowerCase();
    const val = headers[k];
    if (result[key] && Array.isArray(result[key])) {
      result[key].push(val);
    } else if (result[key]) {
      result[key] = [result[key], val];
    } else {
      result[key] = val;
    }
  });
  return result;
}

// listener
app.listen(port);
console.log(`Express listening on port ${port}...`);
