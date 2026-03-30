import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve(process.cwd(), 'scripts/docker/init-databases.sh');

describe('init-databases.sh', () => {
  it('has a valid bash shebang and strict mode flags', () => {
    const script = fs.readFileSync(scriptPath, 'utf8');

    expect(script).toMatch(/^#!\/usr\/bin\/env bash/m);
    expect(script).toContain('set -euo pipefail');
  });

  it('creates both therapy_clinic_dev and keycloak databases', () => {
    const script = fs.readFileSync(scriptPath, 'utf8');

    expect(script).toContain("CREATE DATABASE therapy_clinic_dev");
    expect(script).toContain("CREATE DATABASE keycloak");
    expect(script).toContain("datname = 'therapy_clinic_dev'");
    expect(script).toContain("datname = 'keycloak'");
  });

  it('wraps SQL in a psql heredoc block', () => {
    const script = fs.readFileSync(scriptPath, 'utf8');

    expect(script).toMatch(/psql\s+-v\s+ON_ERROR_STOP=1[\s\S]*<<-EOSQL/);
    expect(script).toContain('EOSQL');
  });
});
