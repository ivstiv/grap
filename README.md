# grap - Simple email grabbing for testing and CI/CD

I got tired of endless email capturing services with stupid pricing justified
by a ton of features that I will never use.

grap aims to be a simple SMTP server wrapped with an API and user system to:

- Generate temporary email addresses on the fly
- Grab email contents through the api
- Be easy to consume and parse the emails from scripts
- Simple to self-host and setup

## Development

You'll need the following things installed on your machine.

- linux-like shell environment (WSL should work, don't know about git-bash)
- Docker
- docker-compose
- Common tools such as: curl, git, telnet

1. Clone the repository

   ```
   git clone git@github.com:ivstiv/grap.git
   cd grap
   ```

2. Start the development container

   The first time it gets started it will take longer to boot up the services
   as it needs to download all of the dependencies.

   ```
    ./compose.sh up server
   ```

3. Wait for the server to turn on

   You should see output similar to:

   ```
   grap-backend | SMTP Server listening on port 25...
   grap-backend | {"level":30,"time":1655847332750,"pid":78,"hostname":"a328362c4b5f","msg":"Server listening at http://0.0.0.0:3000"}
   ```

4. Migrate & Seed the database
   ```
   ./compose.sh exec server npm run migrate:latest
   ./compose.sh exec server npm run seed
   ```

### Open a shell in the dev container

Keep in mind that the container is based on alpine, so you will be dropped on ASH shell.

```
./compose.sh exec server /bin/sh
```

### Send a test email locally

Edit the script to customise the email being sent.

```
./smtp-test.sh <recipient>
```

## Pushing an image

```
docker login
docker build -t ivstiv/grap:latest -f .docker/prod.Dockerfile server
docker push ivstiv/grap:latest
docker logout
```
