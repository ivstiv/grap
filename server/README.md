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

- auto-delete addresses and related inboxes
- implement hardcoded limit for max addresses
- creating/deleting account tokens
- fetching inbox contents
- SameSite session cookie, may be improve dev environment with a domain and nginx proxy?
- ask the user if old addresses can be deleted on generation if the limit is reached
- change password setting
- delete user account setting
- admin user list
- impersonation
- dynamic user limits
