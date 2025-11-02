import { describe, expect, it } from 'vitest';
import { sessions } from '../session.schema';

describe('Session Schema', () => {
  describe('sessions table', () => {
    it('should have correct table name', () => {
      expect((sessions as any)[Symbol.for('drizzle:Name')]).toBe('sessions');
    });

    it('should have all required columns', () => {
      const columns = Object.keys(sessions);
      const requiredColumns = [
        'id',
        'tenantId',
        'locationId',
        'appointmentId',
        'clientId',
        'therapistId',
        'sessionDate',
        'startTime',
        'endTime',
        'durationMinutes',
        'sessionType',
        'cptCode',
        'modifier',
        'placeOfService',
        'units',
        'billingStatus',
        'billedAmount',
        'paidAmount',
        'insurancePaidAmount',
        'patientResponsibilityAmount',
        'claimId',
        'claimSubmittedDate',
        'claimPaidDate',
        'progressNoteCompleted',
        'progressNoteId',
        'clientAttendance',
        'clientEngagement',
        'goalsMet',
        'goalsTotal',
        'supervisorId',
        'supervisionType',
        'sessionSummary',
        'clinicalNotes',
        'signedBy',
        'signedAt',
        'isLocked',
        'createdAt',
        'updatedAt',
        'createdBy',
      ];

      requiredColumns.forEach((col) => {
        expect(columns).toContain(col);
      });
    });

    it('should have correct primary key', () => {
      expect(sessions.id.primary).toBe(true);
    });

    it('should have tenant_id as not null', () => {
      expect(sessions.tenantId.notNull).toBe(true);
    });

    it('should have location_id as not null', () => {
      expect(sessions.locationId.notNull).toBe(true);
    });

    it('should have appointment_id as not null', () => {
      expect(sessions.appointmentId.notNull).toBe(true);
    });

    it('should have client_id as not null', () => {
      expect(sessions.clientId.notNull).toBe(true);
    });

    it('should have therapist_id as not null', () => {
      expect(sessions.therapistId.notNull).toBe(true);
    });

    it('should have session_date as not null', () => {
      expect(sessions.sessionDate.notNull).toBe(true);
    });

    it('should have start_time as not null', () => {
      expect(sessions.startTime.notNull).toBe(true);
    });

    it('should have end_time as not null', () => {
      expect(sessions.endTime.notNull).toBe(true);
    });

    it('should have duration_minutes as not null', () => {
      expect(sessions.durationMinutes.notNull).toBe(true);
    });

    it('should have session_type as not null', () => {
      expect(sessions.sessionType.notNull).toBe(true);
    });

    it('should have units as not null', () => {
      expect(sessions.units.notNull).toBe(true);
    });

    it('should have client_attendance as not null', () => {
      expect(sessions.clientAttendance.notNull).toBe(true);
    });

    it('should have correct default for billingStatus', () => {
      expect(sessions.billingStatus.default).toBe('pending');
    });

    it('should have correct default for progressNoteCompleted', () => {
      expect(sessions.progressNoteCompleted.default).toBe(false);
    });

    it('should have correct default for isLocked', () => {
      expect(sessions.isLocked.default).toBe(false);
    });

    it('should have timestamps with defaults', () => {
      expect(sessions.createdAt.hasDefault).toBe(true);
      expect(sessions.createdAt.notNull).toBe(true);
      expect(sessions.updatedAt.hasDefault).toBe(true);
      expect(sessions.updatedAt.notNull).toBe(true);
    });

    it('should have encrypted PHI fields', () => {
      // Session summary and clinical notes should be encrypted
      const sessionSummaryColumn = sessions.sessionSummary;
      const clinicalNotesColumn = sessions.clinicalNotes;

      expect(sessionSummaryColumn).toBeDefined();
      expect(clinicalNotesColumn).toBeDefined();

      // Check column names indicate encryption
      expect(sessionSummaryColumn.name).toBe('session_summary_encrypted');
      expect(clinicalNotesColumn.name).toBe('clinical_notes_encrypted');
    });
  });
});
