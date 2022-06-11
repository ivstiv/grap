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

4. Check in the end just in case something has slipped

```
npm outdated
```

Check [npm-check-updates's documentation](https://www.npmjs.com/package/npm-check-updates) for more details.
