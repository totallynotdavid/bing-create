# Releasing

A release publishes the package to npm and creates a GitHub release. The
`release` workflow (`.github/workflows/release.yml`) does both when a `v*` tag
is pushed. Nobody stores an npm token: npm trusts the workflow through OIDC.

## Cut a release

1. Set `version` in `package.json`.
2. Write `.github/release-notes.md`. Its first line must be
   `bing-create <version> is out.`
3. Merge both to `master`.
4. Tag the merge commit and push the tag:

   ```bash
   git tag v<version>
   git push origin v<version>
   ```

5. Approve the `publish` job when GitHub asks. It waits for a reviewer of the
   `publishing` environment.

The workflow fails before it publishes if the tag differs from the
`package.json` version or the notes name another version.

## Dry run

The `release` workflow also runs on every pull request and on manual runs
(Actions, release, Run workflow). Every job runs as on a tag: the CI checks, the
tag and notes checks, a preflight, and a build of the npm tarball that installs
the tarball and imports its exports. Only the `publish` and `github` jobs run on
tags alone. On a dry run the notes check compares `package.json` with the notes
file, since there is no tag.

The preflight reads the environments the workflow names and fails if one is
missing from the repository.

## Set up a fork

A maintainer who forks the project does these steps once.

1. In the repository, open Settings, Environments, New environment. Name it
   `publishing`. Add a required reviewer. Under deployment branches and tags,
   select selected branches and tags, then add the tag rule `v*`.
2. Publish the package once with a token, or pick a new package name in
   `package.json`. npm only offers trusted publishing for a package that exists.
3. On npmjs.com, open the package, Settings, Trusted Publisher, GitHub Actions.
   Enter:

   | Field                | Value                  |
   | -------------------- | ---------------------- |
   | Organization or user | the owner of your fork |
   | Repository           | `bing-create`          |
   | Workflow filename    | `release.yml`          |
   | Environment name     | `publishing`           |

4. In `.github/workflows/release.yml`, change `totallynotdavid` in the `publish`
   job's `if:` to your owner.
5. Follow "Cut a release".
