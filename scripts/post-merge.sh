#!/bin/bash
set -e
npm install
npx drizzle-kit push --force || npm run db:push
