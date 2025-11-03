---
therapy-clinic: minor
---

Add comprehensive appointment scheduling system with core services and validations

**Features:**
- Appointment booking service with conflict detection
- Therapist availability management (base templates + overrides)
- Appointment cancellation and rescheduling workflows
- Recurring appointment support (structure in place)
- Waitlist functionality (structure in place)
- Full HIPAA-compliant audit logging
- PHI encryption for appointment notes

**Services:**
- `appointment.service.ts` - Full CRUD for appointments with conflict checking
- `availability.service.ts` - Therapist availability management and effective availability calculation

**Validations:**
- `appointment.validation.ts` - Comprehensive Zod schemas for all appointment operations
- `availability.validation.ts` - Schemas for availability overrides and templates

**Dependencies:**
- Added FullCalendar packages (@fullcalendar/core, react, daygrid, timegrid, interaction)

**Note:** UI components and API routes to be implemented in follow-up commits. This establishes the core business logic layer.
