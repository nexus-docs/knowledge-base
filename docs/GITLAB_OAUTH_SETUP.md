# GitLab OAuth Setup Guide

Connect Nexus Docs to your self-hosted GitLab instance at `gitlab.qoliber.dev` for single sign-on.

## Prerequisites

- Admin access to `gitlab.qoliber.dev`
- Nexus Docs running locally or in production

## Step 1: Create OAuth Application in GitLab

1. Log in to **https://gitlab.qoliber.dev** as an admin
2. Navigate to **Admin Area → Applications**
   - URL: `https://gitlab.qoliber.dev/admin/applications`
3. Click **New Application**
4. Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `Nexus Docs` |
| **Redirect URI** | See below |
| **Confidential** | Yes (checked) |
| **Scopes** | `read_user` `openid` `profile` `email` |

### Redirect URIs

Add one URI per line. Include all environments you need:

```
http://localhost:3000/api/auth/callback/gitlab
https://docs.qoliber.com/api/auth/callback/gitlab
```

5. Click **Save application**
6. You will see the **Application ID** and **Secret** — copy both

> **Important:** The secret is only shown once. Store it securely.

## Step 2: Configure Environment Variables

Add these to your `.env` file:

```bash
# GitLab OAuth
GITLAB_CLIENT_ID=your-application-id-here
GITLAB_CLIENT_SECRET=your-secret-here
GITLAB_URL=https://gitlab.qoliber.dev
```

### Full `.env` example (local development)

```bash
# Database
DATABASE_URL=postgresql://nexus:nexus@localhost:5432/nexus

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=change-this-in-production

# Auth
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# GitLab OAuth
GITLAB_CLIENT_ID=abc123def456
GITLAB_CLIENT_SECRET=your-secret
GITLAB_URL=https://gitlab.qoliber.dev

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=qoliber Docs
```

## Step 3: Start the Application

```bash
# Install dependencies (if not done)
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed default users (optional)
npx prisma db seed

# Start the dev server
npm run dev
```

## Step 4: Test the Login

1. Open **http://localhost:3000/auth/signin**
2. Click the orange **Sign in with GitLab** button
3. You will be redirected to `gitlab.qoliber.dev` to authorize
4. After authorizing, you are redirected back and logged in

## How It Works

### First-time login

When a GitLab user signs in for the first time:

1. NextAuth redirects to `gitlab.qoliber.dev` for OAuth authorization
2. User grants access to the Nexus Docs application
3. NextAuth receives the user's profile (name, email, avatar)
4. A new user record is created in the database with:
   - `tier: public` (default — can only see public docs)
   - Name, email, and avatar from GitLab
   - An `accounts` entry linking their GitLab identity
5. User is signed in and redirected to the app

### Subsequent logins

The user clicks **Sign in with GitLab** and is immediately authenticated — no re-authorization needed (unless they revoked access).

### Access control

New GitLab users start with `public` tier. An admin must upgrade their access:

1. Sign in as admin (`admin@qoliber.com` / `password123`)
2. Go to **Admin → Users** (`/admin/users`)
3. Click the user's name
4. Change their tier to `client`, `partner`, or `admin`
5. For client-tier users, grant specific extension permissions

### Both login methods work

The sign-in page shows:
- **GitLab button** (primary) — for team members with GitLab accounts
- **Email/password form** (fallback) — for seeded users or users without GitLab

## Production Setup

For production deployment at `docs.qoliber.com`:

1. Ensure the redirect URI `https://docs.qoliber.com/api/auth/callback/gitlab` is added in the GitLab application
2. Update `.env` on the production server:

```bash
NEXTAUTH_URL=https://docs.qoliber.com
NEXT_PUBLIC_SITE_URL=https://docs.qoliber.com
```

3. Generate a strong `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Troubleshooting

### "Invalid redirect URI" error

The redirect URI in your `.env` (`NEXTAUTH_URL`) must exactly match one of the URIs registered in the GitLab application. Check:
- Protocol (`http` vs `https`)
- Port (`:3000` for local dev)
- Path must be exactly `/api/auth/callback/gitlab`

### "Access denied" after login

The user was created but has `public` tier. An admin needs to upgrade their tier via `/admin/users`.

### GitLab button not showing

The button only appears when `GITLAB_CLIENT_ID` is set in `.env`. Restart the dev server after adding it.

### Self-signed SSL certificate

If `gitlab.qoliber.dev` uses a self-signed cert, set:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0
```

This is for development only — use a proper certificate in production.

## Revoking Access

### User side

Users can revoke access at:
`https://gitlab.qoliber.dev/-/user_settings/applications`

### Admin side

Admins can delete the OAuth application at:
`https://gitlab.qoliber.dev/admin/applications`
