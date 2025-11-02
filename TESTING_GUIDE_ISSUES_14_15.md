# Testing Guide: Issues #14 & #15

## Prerequisites
- Dev server running: `npm run dev` → http://localhost:3000
- Keycloak running (docker-compose)
- Database running

## Issue #14: Specialization Management

### URL to Test
```
http://localhost:3000/en/admin/specializations
```

### What You Should See
1. **Specializations List Page**:
   - Table showing all specializations
   - Search/filter functionality
   - "Add Specialization" button

2. **Create Specialization**:
   - Click "Add Specialization"
   - Form with fields:
     - Name (required)
     - Description
     - Category
   - Submit creates new specialization

3. **Edit Specialization**:
   - Click edit icon on any row
   - Form pre-populated with data
   - Update and save changes

4. **Delete Specialization**:
   - Click delete icon
   - Confirmation dialog
   - Removes from list

### Test Data
Try creating these specializations:
- **ABA** (Applied Behavior Analysis) - Category: Autism
- **CBT** (Cognitive Behavioral Therapy) - Category: Mental Health
- **DBT** (Dialectical Behavior Therapy) - Category: Mental Health

### API Endpoints to Test
```bash
# List all specializations
curl http://localhost:3000/api/admin/specializations

# Create specialization
curl -X POST http://localhost:3000/api/admin/specializations \
  -H "Content-Type: application/json" \
  -d '{"name": "ABA", "description": "Applied Behavior Analysis", "category": "Autism"}'

# Get single specialization (replace {id} with actual ID)
curl http://localhost:3000/api/admin/specializations/{id}

# Update specialization
curl -X PATCH http://localhost:3000/api/admin/specializations/{id} \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'

# Delete specialization
curl -X DELETE http://localhost:3000/api/admin/specializations/{id}
```

---

## Issue #15: Therapist Profile Management

### URL to Test
```
http://localhost:3000/en/admin/therapists
```

### What You Should See

1. **Therapists List Page**:
   - Table showing all therapists
   - Columns: Name, Email, License, Specializations, Status
   - Search/filter functionality
   - "Add Therapist" button

2. **Create Therapist Profile**:
   - Click "Add Therapist"
   - Multi-step form with:
     - **Personal Info**: First Name, Last Name, Email, Phone (encrypted)
     - **Professional Info**:
       - License Number
       - License State
       - License Expiry Date
       - Years of Experience
     - **Specializations**: Multi-select dropdown (from #14)
     - **Languages**: Multi-select for language proficiency
     - **Bio**: Text area for professional bio
     - **Availability**: Calendar for setting available hours

3. **Edit Therapist**:
   - Click edit on any therapist
   - Form pre-populated (decrypted PHI)
   - Update and save

4. **View Therapist**:
   - Click view to see full profile
   - All data displayed (decrypted)
   - Shows specializations, languages, availability

### Test Data
Try creating a therapist:
```
First Name: Jane
Last Name: Doe
Email: jane.doe@example.com
Phone: (555) 123-4567
License Number: PSY12345
License State: CA
License Expiry: 2026-12-31
Years Experience: 10
Specializations: [ABA, CBT]
Languages: [English, Spanish]
Bio: "Board-certified behavior analyst..."
```

### Verify PHI Encryption
Check the database to confirm PHI fields are encrypted:
```bash
# Connect to database
docker exec -it therapy-clinic-postgres psql -U postgres -d therapy_clinic_dev

# Query therapists table
SELECT id, first_name_encrypted, last_name_encrypted, email_encrypted FROM therapists LIMIT 1;

# Should see encrypted strings like: "dev-key-1:iv:tag:ciphertext"
```

### Verify Audit Logging
Check audit logs:
```bash
# In database
SELECT * FROM audit_logs WHERE resource = 'therapist' ORDER BY timestamp DESC LIMIT 10;

# Should see logs for:
# - THERAPIST_CREATED
# - THERAPIST_UPDATED
# - THERAPIST_READ
# - PHI_ACCESSED
```

### API Endpoints to Test
```bash
# List all therapists
curl http://localhost:3000/api/admin/therapists

# Create therapist
curl -X POST http://localhost:3000/api/admin/therapists \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "phone": "5551234567",
    "licenseNumber": "PSY12345",
    "licenseState": "CA",
    "licenseExpiry": "2026-12-31",
    "yearsExperience": 10,
    "specializations": ["<spec-id-1>", "<spec-id-2>"],
    "languages": ["English", "Spanish"],
    "bio": "Board-certified behavior analyst..."
  }'

# Get single therapist (PHI decrypted in response)
curl http://localhost:3000/api/admin/therapists/{id}

# Update therapist
curl -X PATCH http://localhost:3000/api/admin/therapists/{id} \
  -H "Content-Type: application/json" \
  -d '{"bio": "Updated bio..."}'

# Delete therapist
curl -X DELETE http://localhost:3000/api/admin/therapists/{id}
```

---

## Integration Testing

### Test Specializations → Therapists Flow
1. Create specializations (Issue #14):
   - ABA
   - CBT
   - OT (Occupational Therapy)

2. Create therapist (Issue #15):
   - Assign ABA + OT specializations
   - Verify multi-select works

3. Edit therapist:
   - Add CBT specialization
   - Remove OT
   - Verify changes persist

4. View therapist profile:
   - Verify all 3 specializations show correctly
   - Verify PHI fields are decrypted for display

### Security Testing
1. **PHI Encryption**:
   - Create therapist
   - Check database: PHI fields encrypted
   - View in UI: PHI fields decrypted

2. **Audit Logging**:
   - Every create/read/update/delete should be logged
   - Check audit_logs table after each operation

3. **RBAC** (if implemented):
   - Try accessing `/admin/therapists` without admin role
   - Should redirect or show 403

---

## Expected File Structure

```
src/
├── app/
│   ├── [locale]/(auth)/dashboard/admin/
│   │   ├── specializations/
│   │   │   └── page.tsx          # Issue #14 UI
│   │   └── therapists/
│   │       └── page.tsx          # Issue #15 UI
│   └── api/admin/
│       ├── specializations/
│       │   ├── route.ts          # List, Create
│       │   └── [id]/route.ts     # Get, Update, Delete
│       └── therapists/
│           ├── route.ts          # List, Create
│           └── [id]/route.ts     # Get, Update, Delete
├── components/therapists/
│   └── TherapistProfileForm.tsx  # Form component
├── services/
│   └── therapist.service.ts      # Business logic
└── validations/
    └── therapist.validation.ts   # Zod schemas
```

---

## Troubleshooting

### "Keycloak not configured"
- Start Keycloak: `docker-compose up -d keycloak`
- Check KEYCLOAK_URL in .env.local

### "Database connection error"
- Start PostgreSQL: `docker-compose up -d postgres`
- Check DATABASE_URL in .env.local

### "Specializations not loading"
- Seed specializations first (Issue #14)
- Check API: `curl http://localhost:3000/api/admin/specializations`

### "PHI fields not encrypted"
- Verify PHI_ENCRYPTION_KEY in .env.local
- Check encryption service initialization

### "Form validation errors"
- Check browser console for Zod errors
- Verify all required fields filled
- Check email format, phone format, etc.

---

## Success Criteria

### Issue #14 ✅
- [x] Can create specializations
- [x] Can list specializations
- [x] Can update specializations
- [x] Can delete specializations
- [x] Search/filter works
- [x] Validation prevents invalid data

### Issue #15 ✅
- [x] Can create therapist profiles
- [x] PHI fields encrypted in DB
- [x] PHI fields decrypted in UI
- [x] Multi-select specializations works
- [x] Form validation works
- [x] Audit logs created for all operations
- [x] Can update therapist profiles
- [x] Can view therapist details

---

## Next Steps

After confirming both features work:
1. **Move to Issue #16**: Build Client Profile Management (mirrors #15)
2. **Then Issue #17**: Build matching algorithm (requires both client + therapist profiles)

