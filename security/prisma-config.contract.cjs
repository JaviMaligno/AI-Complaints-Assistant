// Actual Prisma6 config consumer with corrected merger, never a DB/client job.
require('./deny-io.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const requireRoot = createRequire(path.join(root, 'package.json'));

(async () => {
  let entry;
  try { entry = requireRoot.resolve('@prisma/config'); }
  catch { entry = createRequire(requireRoot.resolve('prisma/package.json')).resolve('@prisma/config'); }
  const requireConfig = createRequire(entry);
  const { loadConfigFromFile } = requireConfig(entry);
  const mergerEntry = requireConfig.resolve('deepmerge-ts');
  assert.equal(JSON.parse(fs.readFileSync(path.resolve(path.dirname(mergerEntry), '../package.json'), 'utf8')).version, '8.0.2');
  const { deepmerge } = requireConfig('deepmerge-ts');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-config-contract-'));
  const originalCwd = process.cwd();
  try {
    process.chdir(fixture);
    const configFile = path.join(fixture, 'prisma.config.cjs');
    fs.writeFileSync(configFile, "module.exports = { schema: './synthetic.prisma', migrations: { path: './migrations' } };\n");
    const actual = await loadConfigFromFile({ configFile, configRoot: fixture });
    assert.equal(actual.error, undefined);
    assert.equal(actual.config.schema, path.join(fixture, 'synthetic.prisma'));
    assert.equal(actual.config.migrations.path, path.join(fixture, 'migrations'));
    const left = { record: { keep: 1, value: 'left' }, list: [1], optional: undefined };
    const right = { record: { added: 2, value: 'right' }, list: [2], optional: 'present' };
    assert.deepEqual(deepmerge(left, right), { record: { keep: 1, added: 2, value: 'right' }, list: [1, 2], optional: 'present' });
    assert.deepEqual(left.record, { keep: 1, value: 'left' });
    const a = { value: 'first' }; a.self = a;
    const b = { other: 'second' }; b.self = b;
    const merged = deepmerge(a, b);
    assert.equal(merged.self, merged);
    assert.equal(merged.value, 'first');
    assert.equal(merged.other, 'second');
    assert.deepEqual(globalThis.__offlineDependencyAttempts, { network: 0, processes: 0, envReads: 0 });
    console.log('PASS: actual Prisma config loader, acyclic merge and circular safety (3 offline contracts).');
  } finally {
    process.chdir(originalCwd);
    // Delete only the exact directory this test created in the named temp root.
    assert.equal(path.dirname(fixture), path.resolve(os.tmpdir()));
    assert.ok(path.basename(fixture).startsWith('prisma-config-contract-'));
    fs.rmSync(fixture, { recursive: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
