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

Todos:

- auto-update dev image and rebuild conditionally
- testing proof of concept session cookie
- publish image on push
- Add corrct hrefs, fix emoji in about
- change password setting
- impersonation
- replace yup with zod
