#!/bin/sh
pnpm run migrate:latest
pnpm run seed
pnpm run start