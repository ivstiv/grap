## Writing tests

The project is using [mocha](https://mochajs.org/) and [fastify's injection](https://www.fastify.io/docs/latest/Guides/Testing) method to make sure all pages behave as expected. There are some additional improvements by [mocha-steps](https://www.npmjs.com/package/mocha-steps) which just make it that much nicer to schedule related tests in a synchronous way. **Make sure you have .env.test before you run any tests!** The tests are based on a
compilation step, so the most convenient way to run them is with a running dev container.

## Keep it updated

1. Do the upgrades from inside the dev container to ensure system consistency

```
./compose.sh exec server /bin/sh
```

2. Get the minor updates and test the app

```
npx npm-check-updates -u -t minor && npm install
```

3. Get the major updates and test the app

```
npx npm-check-updates -u -t latest && npm install
```

4. Run `npm update` to update nested depedencies

5. Check in the end just in case something has slipped

```
npm outdated
```

Check [npm-check-updates's documentation](https://www.npmjs.com/package/npm-check-updates) for more details.

## Todos:

- Match email by partial title
- publish image on push
- check for latest release version
- impersonation
- replace yup with zod
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
