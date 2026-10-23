# Dependency security update (22 October 2026)

Use Node24.22.1 (`.nvmrc`) and the committed npm lock with `npm ci`. Original working copies are outside this patch. No deployment, store upload, production data operation or credential change is established by this source update.

Next and eslint-config-next use the matching15.5.28 release. The scoped Next PostCSS override follows the corrected direct PostCSS8 dependency; it changes no major API. React, application routes, database schema and business behavior are unchanged by source edits.

Raw OSV comparison retains `braces`3.0.3 (GHSA-vfj7-8cjw-p6xm), with no published fix, and `postcss-selector-parser`6.1.5 (GHSA-rj75-hqrm-r3gf). The parser result is a database discrepancy: the maintainer's [6.1.5 release](https://raw.githubusercontent.com/postcss/postcss-selector-parser/6.1.5/CHANGELOG.md) backports this CVE's linear-time fix. Registry tarball, lock integrity and installed parser bytes agree. Keep the raw finding visible; no parser7 override is needed.

Prisma6's config loader originally pinned deepmerge-ts7.1.5, affected by GHSA-ggr8-5vv4-36mx. The follow-up scopes8.0.2 to that loader after isolated before/after tests preserve its actual configuration and acyclic merge contracts and reproduce7's circular-input failure. Prisma/client/schema and application database calls remain on6. Frozen installation with scripts disabled and all three installed consumer contracts pass. No database or generation operation is used as proof; the final hosted CI remains a separate gate.

Run `node security/prisma-config.contract.cjs` after the frozen install. It loads the real configuration function with a synthetic temporary config and verifies ordinary/circular merge behavior. Its guard denies env-file reads, network/listen and subprocesses before imports; it never generates a client, seeds data or connects to a database.

A fresh query of468 exact public package/version pairs in the final lock reports only braces3.0.3 and the known selector6.1.5 database discrepancy. The deepmerge7 advisory is absent from the actual updated graph. This scoped result is not a claim about unqueried packages, image layers or deployment.

The initial local comparison used317 cached public GHSA records. A subsequent OSV query checked the current public npm package names and exact lock versions; it confirmed the residuals above. Only public name/version pairs were sent, without private dependency edges or code. No-match results do not establish that every dependency or deployed artifact is vulnerability-free.
