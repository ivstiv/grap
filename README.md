# grap - Simple email grabbing for testing and CI/CD

![Coverage](./server/coverage/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/ivstiv/grap/badge.svg?targetFile=server/package.json&style=flat)](https://snyk.io/test/github/ivstiv/grap?targetFile=server/package.json)
[![Maintainability](https://api.codeclimate.com/v1/badges/41d71d73a5255fc1da5a/maintainability)](https://codeclimate.com/github/ivstiv/grap/maintainability)
[![Docker Pulls](https://img.shields.io/docker/pulls/ivstiv/grap?logo=docker&logoColor=white&style=flat)](https://hub.docker.com/r/ivstiv/grap "open on dockerhub")
[![Discord](https://img.shields.io/discord/663517902258962473?color=blue&label=Need%20help%3F&logo=discord&logoColor=white&style=flat)](https://discord.gg/VMSDGVD)

I got tired of endless email capturing services with stupid pricing justified
by a ton of features that I will never use.

grap aims to be a simple SMTP server wrapped with an API and user system to aid automation of email based workflows.

Features:

- Web interface to manage emails & users
- REST API to generate addresses and grab emails
- SMTP server to receive the emails

Planned features:

- Multi domain support
- API endpoint for filtering inboxes
- Version checker in the UI
- Domain checker for validating DNS setup
- Statistics and more control over users

## [Deploy using docker](https://hub.docker.com/r/ivstiv/grap)

> Follow the steps in the image description

## Development

You'll need the following things installed on your machine.

- linux-like shell environment (WSL should work, don't know about the various bash emulators)
- Docker
- docker compose (not docker-compose)
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

### Run the test suite

```
./compose.sh exec server npm test
```

## Pushing an image

```
docker login
docker pull node:18-alpine
docker build -t ivstiv/grap:latest -f .docker/prod.Dockerfile server
docker push ivstiv/grap:latest
docker logout
```
