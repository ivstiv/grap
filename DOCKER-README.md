## grap

A simple system to manage temporary email addresses. It ships with the bare minimum of features needed for automation. Check out [grap.email](https://grap.email) for a demo or the repository for more information.

[![Github](https://img.shields.io/static/v1.svg?style=for-the-badge&label=grap&message=GitHub&logo=github)](https://github.com/Ivstiv/grap "view the source code")
[![Discord](https://img.shields.io/discord/663517902258962473?color=lightgrey&label=Discord&logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/VMSDGVD "Join discord for feedback/help")

## Version Tags

The `latest` tag usually provides the latest stable version ready for production use.

|     Tag      | Description               |
| :----------: | ------------------------- |
|    latest    | Stable releases           |
| experimental | Testing new features      |
|   v*.*.\*    | Version specific releases |

## Installation

Before starting the container don't forget to open one port (of your choice, example is using port 80) for the webserver and one for the SMTP server (should be port 25). **The snippets below are just examples. You need to amend the domain and environment to suit yours.**

### docker-compose

```
version: "3"
services:
  grap:
    image: ivstiv/grap
    container_name: grap
    ports:
      - "25:25"
      - "80:3000"
    environment:
      NODE_ENV: production
      DATABASE_PATH: /database/database.sqlite
      SESSION_SECRET: i-hope-you-update-me-on-prod-i-need-to-be-at-least-32-chars
      DOMAIN: grap.email
    volumes:
      - ./grap/database:/database
    restart: always
```

### docker cli

```
# make sure the ports that you are binding to are open and free
docker create \
        --name grap \
        -p "25:25" \
        -p "80:3000" \
        -e NODE_ENV="production" \
        -e DATABASE_PATH="/database/database.sqlite" \
        -e SESSION_SECRET="i-hope-you-update-me-on-prod-i-need-to-be-at-least-32-chars" \
        -e DOMAIN="grap.email" \
        -v "$(pwd)/grap/database":/database \
        ivstiv/grap
# use start/stop to control the container
docker start grap
```

## DNS setup

You will need the following DNS records to be able to send emails and use the service effectively.

- "A" record pointing at your server/proxy
- MX record pointing at your A record
  For example here is my setup with Cloudflare:
  | Type | Name | Content |
  | :----------: | ------------------------- | --- |
  | A | grap.email | 78.142.235.248 |
  | MX | grap.email | grap.email |
