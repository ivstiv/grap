## Writing tests

The project is using [mocha](https://mochajs.org/) and [fastify's injection](https://www.fastify.io/docs/latest/Guides/Testing) method to make sure all pages behave as expected. There are some additional improvements by [mocha-steps](https://www.npmjs.com/package/mocha-steps) which just make it that much nicer to schedule related tests in a synchronous way. **Make sure you have .env.test before you run any tests!** The tests are based on a
compilation step, so the most convenient way to run them is with a running dev container.

Narrow down the test run
```
pnpm test -- -g "Settings routes"
```

## Keep it updated

1. Do the upgrades from inside the dev container to ensure system consistency

```
./compose.sh run --rm server bash
```

2. Get the minor updates and test the app

```
pnpm update
```

3. Get the major updates and test the app

```
pnpm update --latest
```

4. Check in the end just in case something has slipped

```
pnpm outdated
```


## Todos:

- Match email by partial title
- multiple domains??
- delete users
- check for latest release version (may be pure frontend, public github api?)
- This smtp error

```
node:events:505
      throw er; // Unhandled 'error' event
      ^
Error: 8819B0593F7F0000:error:0A000076:SSL routines:tls_choose_sigalg:no suitable signature algorithm:../deps/openssl/openssl/ssl/t1_lib.c:3331:
Emitted 'error' event on SMTPServer instance at:
    at SMTPServer._onError (/app/node_modules/smtp-server/lib/smtp-server.js:332:14)
    at SMTPConnection.<anonymous> (/app/node_modules/smtp-server/lib/smtp-server.js:95:44)
    at SMTPConnection.emit (node:events:527:28)
    at SMTPConnection._onError (/app/node_modules/smtp-server/lib/smtp-connection.js:388:14)
    at TLSSocket.<anonymous> (/app/node_modules/smtp-server/lib/smtp-connection.js:1415:52)
    at Object.onceWrapper (node:events:642:26)
    at TLSSocket.emit (node:events:527:28)
    at TLSSocket._tlsError (node:_tls_wrap:905:8)
    at TLSSocket.emit (node:events:539:35)
    at emitErrorNT (node:internal/streams/destroy:151:8) {
  library: 'SSL routines',
  reason: 'no suitable signature algorithm',
  code: 'ERR_SSL_NO_SUITABLE_SIGNATURE_ALGORITHM',
  remote: 'ip-here'
}
```