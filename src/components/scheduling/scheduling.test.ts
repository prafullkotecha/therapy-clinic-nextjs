import { describe, expect, it } from 'vitest';
import { AppointmentCalendar } from './AppointmentCalendar';
import { AppointmentDetailPanel } from './AppointmentDetailPanel';

describe('scheduling components', () => {
  it('exports appointment calendar component', () => {
    expect(typeof AppointmentCalendar).toBe('function');
  });

  it('exports appointment detail panel component', () => {
    expect(typeof AppointmentDetailPanel).toBe('function');
  });
});
