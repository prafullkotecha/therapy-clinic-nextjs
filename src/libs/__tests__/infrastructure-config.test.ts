import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('infrastructure and docs configuration', () => {
  it('docker-compose uses dedicated keycloak database and redis persistence', () => {
    const compose = fs.readFileSync(path.resolve(root, 'docker-compose.yml'), 'utf8');

    expect(compose).toContain('KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak');
    expect(compose).toContain('depends_on:');
    expect(compose).toContain('condition: service_healthy');
    expect(compose).toContain('redis_data:/data');
    expect(compose).toContain('REDIS_PASSWORD: $' + '{REDIS_PASSWORD:-}');
  });

  it('env templates include required local placeholders', () => {
    const envExample = fs.readFileSync(path.resolve(root, '.env.example'), 'utf8');
    const envProduction = fs.readFileSync(path.resolve(root, '.env.production'), 'utf8');
    const gitignore = fs.readFileSync(path.resolve(root, '.gitignore'), 'utf8');

    expect(envExample).toContain('DATABASE_URL=');
    expect(envExample).toContain('REDIS_URL=redis://localhost:6379');
    expect(envExample).toContain('AUTH_SECRET=');
    expect(envExample).toContain('AUTH_URL=');
    expect(gitignore).toContain('.env');
    expect(envProduction).toContain('NEXT_PUBLIC_APP_URL=https://your-production-domain.example.com');
    expect(envProduction).not.toContain('demo.nextjs-boilerplate.com');
    expect(envProduction).not.toContain('contact@creativedesignsguru.com');
  });

  it('README is project-specific and free of boilerplate branding', () => {
    const readme = fs.readFileSync(path.resolve(root, 'README.md'), 'utf8');

    expect(readme).toContain('# Therapy Clinic Next.js');
    expect(readme).toContain('## Local setup');
    expect(readme).not.toContain('nextjs-boilerplate');
    expect(readme).not.toContain('creativedesignsguru');
    expect(readme).not.toContain('ixartz');
  });

  it('next config does not set static export output mode', () => {
    const nextConfig = fs.readFileSync(path.resolve(root, 'next.config.ts'), 'utf8');

    expect(nextConfig).not.toMatch(/output:\s*['"]export['"]/);
  });

  it('dashboard page opts out of static pre-rendering', () => {
    const dashboardPage = fs.readFileSync(
      path.resolve(root, 'src/app/[locale]/(auth)/dashboard/page.tsx'),
      'utf8',
    );

    expect(dashboardPage).toContain('export const dynamic = \'force-dynamic\';');
  });
});
