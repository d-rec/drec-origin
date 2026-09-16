# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report suspected vulnerabilities in D-REC Origin, the D-REC portal, or the
hosted D-REC platform by email to **<privacy@drec.energy>**. Include:

- a description of the issue and its potential impact,
- steps to reproduce or a proof of concept,
- the affected component and version/commit, if known,
- how we can contact you for follow-up.

We will acknowledge your report, keep you informed as we investigate, and
credit you in the fix (unless you prefer otherwise). We ask that you give us a
reasonable opportunity to remediate before any public disclosure and that you
avoid accessing, modifying, or exfiltrating data that is not your own while
testing.

## Supported versions

Security fixes are applied to the `develop` branch and promoted to the `stage`
and `prod` deployment branches. Please report against the latest commit on
`develop`.

## Scope notes

- Secrets are never committed to this repository; `.env` is git-ignored and
  `.env.example` ships without values for signing secrets.
- Dependency vulnerabilities are tracked through GitHub Dependabot alerts.
