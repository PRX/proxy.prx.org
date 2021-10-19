# PRX.org Proxy Server

Top-level proxy server for www.prx.org. Any requests coming to the www.prx.org
domain will pass through this proxy, and either be:

- Redirected to another site (Exchange, Beta, Listen)
- Proxied in-place to another site (Corporate)

Also handles traffic for `www.pri.org`. Different rule sets are used for each
domain.

## Routing

Incoming requests are routed on a combination of:

1. Domain
1. `x-prx-domain` header
1. Path
2. Logged in/out of PRX single sign on
3. Is a web-crawler / bot
4. Is a mobile device
5. Navigated away or opted-out of the mobile site

Generally, when you are logged in, a subset of paths will be 302-redirected to
Exchange (story pages, series pages, etc).  If you are logged out, those paths
tend to redirect you to Beta/Listen.

Any paths not explicitly indicated in the routes will fall through to the
Corporate site proxy.  So you'll stay on the www.prx.org domain, and see the
corporate site.

When running as the origin behind a CDN, the proxy will not receive the viewer
request domain (e.g., prx.org). The CDN can be configured to pass an
`x-prx-domain` header with the origin request to indicate which rule set
should be used to handle the request.

### Adding a route

By convention, routes are all in the `routes/` directory.  The exported routes
must be an array, each item being called with `.test()`.  Since the first argument
is a path, you can just provide a regular expression for simple cases.  For more
complex routing (see `routes/listen-redirect.js`), each item should be a function
handling the 5 routing params listed above.

### Rewriting a route

Sometimes, you may want to change a request path before proxying/redirecting to
the destination.  In this case, just pass a function to the `Redirect` or `Proxy`
class constructor, that takes in the path string and returns a Promise resolving
to the new path.  See `routes/listen-rewrite.js` for an example.

## Install

This application is intended to run as an AWS [API Gateway](https://aws.amazon.com/api-gateway/),
but you can also test and develop it locally.  Make sure you have node 10.x
installed ([nvm](https://github.com/creationix/nvm) is your friend), and a
recent version of [yarn](https://yarnpkg.com/en/).

```
# setup
yarn install
cp env-example .env

# run the tests
npm test

# dev server at localhost:3000
npm start
```

NOTE: docker dev-server not supported yet, but you can still run the tests.

```
docker-compose build
docker-compose run test
```

## License

[AGPL License](https://www.gnu.org/licenses/agpl-3.0.html)
