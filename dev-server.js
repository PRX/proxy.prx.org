'use strict';

const handler = require('./index');
const express = require('express');
const bodyParser = require('body-parser');
const typeis = require('type-is');
const app = express();

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
      res.status(data.statusCode);
      res.set(data.headers || {});
      if (data.body && data.isBase64Encoded) {
        const buff = Buffer.from(data.body, 'base64')
        res.send(buff);
        // res.write(buff, 'binary');
        // res.end(undefined, 'binary');
      } else if (data.body) {
        res.send(data.body);
      } else {
        res.end();
      }
    }
  });
});

// listener
const port = process.env.PORT || 3000;
app.listen(process.env.PORT || 3000);
console.log(`Express listening on port ${port}...`);
