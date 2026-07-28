#!/usr/bin/env bash
# Runs on the production server. The repository must be cloned at /opt/snabju.
set -Eeuo pipefail

project_dir=/opt/snabju
branch="${DEPLOY_BRANCH:-master}"

if [[ ! "$branch" =~ ^[A-Za-z0-9._/-]+$ ]]; then
  echo "Invalid DEPLOY_BRANCH value" >&2
  exit 1
fi

cd "$project_dir"

if [[ ! -f .env ]]; then
  echo "Missing $project_dir/.env; copy .env.production.example and fill in production secrets." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Production checkout has uncommitted changes; refusing to overwrite them." >&2
  exit 1
fi

git fetch --prune origin "$branch"
git checkout "$branch"
git pull --ff-only origin "$branch"

docker compose --env-file .env -f docker-compose.prod.yml up -d --build --remove-orphans
docker compose --env-file .env -f docker-compose.prod.yml ps
