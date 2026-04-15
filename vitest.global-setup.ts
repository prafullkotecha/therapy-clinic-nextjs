/**
 * Runs once before Vitest workers start. Ensures `DATABASE_URL` is set so
 * `src/libs/Env.ts` resolves before any module imports `db`.
 * If you already define `DATABASE_URL` in `.env.local` / `.env`, that value is kept.
 */
export default function setup(): void {
  if (process.env.DATABASE_URL?.trim()) {
    return;
  }
  process.env.DATABASE_URL
    = 'postgresql://postgres:postgres@127.0.0.1:5432/therapy_clinic_dev';
}
