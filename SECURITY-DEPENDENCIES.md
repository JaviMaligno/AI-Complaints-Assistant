# Dependency security update (22 October 2026)

Use Node24.22.1 (`.nvmrc`) and the committed npm lock with `npm ci`. Original working copies are outside this patch. No deployment, store upload, production data operation or credential change is established by this source update.

Next and eslint-config-next use the matching15.5.28 release. The scoped Next PostCSS override follows the corrected direct PostCSS8 dependency; it changes no major API. React, application routes, database schema and business behavior are unchanged by source edits.

Known residuals: the fresh public OSV package/version comparison still matches `braces`3 and `postcss-selector-parser`6 in the tooling graph. There is no fixed braces release in that corpus; resolving the selector-parser issue requires an explicitly tested parent/tooling migration rather than forcing7 into a parent requiring6. Prisma6 also retains deepmerge-ts7, whose fix requires major8; this patch does not force that dependency or migrate the database client to Prisma7. These remain unresolved findings, not evidence that their vulnerable APIs are reached by this application.

The initial local comparison used317 cached public GHSA records. A subsequent OSV query checked the current public npm package names and exact lock versions; it confirmed the residuals above. Only public name/version pairs were sent, without private dependency edges or code. No-match results do not establish that every dependency or deployed artifact is vulnerability-free.
