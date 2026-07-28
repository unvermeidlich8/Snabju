# Production deployment

Production is deployed automatically after CI succeeds for a push to `master`.
The deploy workflow connects to the server over SSH and runs
`/home/deploy/snabju/scripts/deploy-production.sh`.

## One-time server setup

1. Install Docker Engine with the Docker Compose plugin and Git.
2. Create a non-root deploy user that can run Docker, then add its public SSH key
   to `~/.ssh/authorized_keys`.
3. Clone this repository into `/home/deploy/snabju` as that user and check out `master`.
4. Copy `.env.production.example` to `/home/deploy/snabju/.env` and set real production
   values. Keep this file only on the server.
5. Ensure ports 80 and 443 reach the server. Caddy obtains and renews TLS
   certificates automatically when `DOMAIN` points to this server.
6. Run the first deployment manually:

   ```sh
   cd /home/deploy/snabju
   bash scripts/deploy-production.sh
   ```

The deployment retains Docker volumes, including PostgreSQL, Redis, uploads and
Caddy certificates. It refuses to run if the server checkout has local changes.

## GitHub configuration

Create a GitHub Environment named `production`. Add these environment secrets:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | Server IP address or hostname |
| `DEPLOY_USER` | The non-root deploy user |
| `SSH_PRIVATE_KEY` | Private half of a dedicated ED25519 deploy key |
| `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -H your-server-hostname` verified from a trusted connection |

In the Environment settings, optionally require an approval before production
deployments. In repository settings, protect `master` and require the `CI`
status checks before merging pull requests.

## Protecting the production branch

In GitHub, open **Settings → Branches → Add branch protection rule** and use
`master` as the branch name pattern. Enable the following options:

- Require a pull request before merging.
- Require status checks to pass before merging, then select `Backend checks`
  and `Frontend checks`.
- Require branches to be up to date before merging.
- Optionally, do not allow bypassing the above settings.

Afterward, make changes in a feature branch and merge a pull request into
`master`. A successful merge triggers CI and then the production deployment.

## Rollback

To roll back code, revert the problematic commit on `master`; CI will deploy the
revert automatically. Database migrations must remain backward-compatible during
the deployment window. Restore the database from a backup if a migration itself
needs to be rolled back.
