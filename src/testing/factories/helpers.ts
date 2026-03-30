import { faker } from '@faker-js/faker';

export function formatDateForPostgres(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

export function randomPhoneNumber(): string {
  return faker.phone.number();
}
