#!/usr/bin/env bash
set -euo pipefail

# \gexec executes the SELECT result as SQL, allowing idempotent conditional CREATE DATABASE.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  SELECT 'CREATE DATABASE therapy_clinic_dev'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'therapy_clinic_dev')\gexec

  SELECT 'CREATE DATABASE keycloak'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec
EOSQL
