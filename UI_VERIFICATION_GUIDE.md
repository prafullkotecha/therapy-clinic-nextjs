# UI Verification Guide: Issues #14 & #15

## ✅ Authentication Check Passed!

Both admin pages are correctly protected by authentication middleware:
- `/en/dashboard/admin/specializations` → Redirects to `/en/sign-in`
- `/en/dashboard/admin/therapists` → Redirects to `/en/sign-in`

This confirms the RBAC middleware from Issue #11 is working!

---

## How to Visually Verify

### Step 1: Start Services

```bash
# Terminal 1: Start database
docker-compose up -d postgres

# Terminal 2: Start Keycloak
docker-compose up -d keycloak

# Terminal 3: Start dev server (already running)
npm run dev
```

### Step 2: Log In

1. **Open browser**: http://localhost:3000
2. **Click "Sign In"** or navigate to: http://localhost:3000/en/sign-in
3. **Log in with Keycloak credentials**:
   - Use the admin account you created in Issue #3
   - Or create a new account with admin role

### Step 3: Navigate to Admin Pages

Once logged in, you'll have access to the admin dashboard.

---

## Issue #14: Specialization Management UI

### URL
```
http://localhost:3000/en/admin/specializations
```

### What You Should See

**Page Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Therapy Clinic - Admin Dashboard                    │
├──────────────────────────────────────────────────────┤
│  Sidebar:                                             │
│  - Dashboard                                          │
│  - Specializations  ← You are here                   │
│  - Therapists                                         │
│  - Clients                                            │
│  - Appointments                                       │
│  - Reports                                            │
└──────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════╗
║  Specializations Management                            ║
╠════════════════════════════════════════════════════════╣
║                                                         ║
║  [Search: _____________]  [+ Add Specialization]       ║
║                                                         ║
║  ┌─────────────────────────────────────────────────┐  ║
║  │ Name          │ Description      │ Category    │  ║
║  ├─────────────────────────────────────────────────┤  ║
║  │ ABA           │ Applied Behavior │ Autism      │  ║
║  │               │ Analysis         │             │  ║
║  │ [Edit] [Delete]                                │  ║
║  ├─────────────────────────────────────────────────┤  ║
║  │ CBT           │ Cognitive        │ Mental      │  ║
║  │               │ Behavioral       │ Health      │  ║
║  │ [Edit] [Delete]                                │  ║
║  └─────────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════╝
```

**Key UI Elements:**
- ✅ **Header**: "Specializations Management"
- ✅ **Search bar**: Filter specializations
- ✅ **Add button**: Opens create form
- ✅ **Data table**: Shows all specializations
- ✅ **Action buttons**: Edit and Delete for each row
- ✅ **Responsive design**: Works on mobile/tablet/desktop

**Create/Edit Form:**
```
╔═══════════════════════════════════════╗
║  Add Specialization                    ║
╠═══════════════════════════════════════╣
║                                        ║
║  Name: *                               ║
║  [_________________]                   ║
║                                        ║
║  Description:                          ║
║  [_________________]                   ║
║  [_________________]                   ║
║                                        ║
║  Category:                             ║
║  [▼ Select Category]                   ║
║                                        ║
║  [Cancel]  [Save]                      ║
╚═══════════════════════════════════════╝
```

**Validation:**
- Name is required
- Name must be unique
- Category must be selected

---

## Issue #15: Therapist Profile Management UI

### URL
```
http://localhost:3000/en/admin/therapists
```

### What You Should See

**Page Layout:**
```
╔════════════════════════════════════════════════════════╗
║  Therapist Management                                  ║
╠════════════════════════════════════════════════════════╣
║                                                         ║
║  [Search: _____________]  [+ Add Therapist]            ║
║                                                         ║
║  ┌──────────────────────────────────────────────────┐  ║
║  │ Name      │ Email      │ License │ Specializations│║
║  ├──────────────────────────────────────────────────┤  ║
║  │ Jane Doe  │ jane@...   │ PSY1234 │ ABA, CBT      │  ║
║  │ [View] [Edit] [Delete]                           │  ║
║  ├──────────────────────────────────────────────────┤  ║
║  │ John Smith│ john@...   │ MFT5678 │ DBT, OT       │  ║
║  │ [View] [Edit] [Delete]                           │  ║
║  └──────────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════╝
```

**Create/Edit Form (Multi-Step):**

**Step 1: Personal Information**
```
╔═══════════════════════════════════════╗
║  Add Therapist - Step 1 of 3          ║
╠═══════════════════════════════════════╣
║  Personal Information                  ║
║                                        ║
║  First Name: *                         ║
║  [_________________]                   ║
║                                        ║
║  Last Name: *                          ║
║  [_________________]                   ║
║                                        ║
║  Email: *                              ║
║  [_________________]                   ║
║                                        ║
║  Phone:                                ║
║  [_________________]                   ║
║                                        ║
║  🔒 PHI fields encrypted                ║
║                                        ║
║  [Cancel]  [Next →]                    ║
╚═══════════════════════════════════════╝
```

**Step 2: Professional Information**
```
╔═══════════════════════════════════════╗
║  Add Therapist - Step 2 of 3          ║
╠═══════════════════════════════════════╣
║  Professional Information              ║
║                                        ║
║  License Number: *                     ║
║  [_________________]                   ║
║                                        ║
║  License State: *                      ║
║  [▼ Select State]                      ║
║                                        ║
║  License Expiry: *                     ║
║  [📅 Select Date]                      ║
║                                        ║
║  Years of Experience:                  ║
║  [_________________]                   ║
║                                        ║
║  [← Back]  [Next →]                    ║
╚═══════════════════════════════════════╝
```

**Step 3: Specializations & Details**
```
╔═══════════════════════════════════════╗
║  Add Therapist - Step 3 of 3          ║
╠═══════════════════════════════════════╣
║  Specializations & Details             ║
║                                        ║
║  Specializations: *                    ║
║  [☑ ABA] [☑ CBT] [☐ DBT] [☐ OT]       ║
║  (Select multiple)                     ║
║                                        ║
║  Languages:                            ║
║  [☑ English] [☑ Spanish] [☐ French]   ║
║                                        ║
║  Bio:                                  ║
║  [_____________________________]       ║
║  [_____________________________]       ║
║  [_____________________________]       ║
║                                        ║
║  [← Back]  [Save]                      ║
╚═══════════════════════════════════════╝
```

**View Therapist Detail:**
```
╔════════════════════════════════════════════╗
║  Therapist Profile                         ║
╠════════════════════════════════════════════╣
║  Jane Doe                                   ║
║  jane.doe@example.com                      ║
║  (555) 123-4567                            ║
║                                             ║
║  Professional Details:                      ║
║  - License: PSY12345 (CA)                  ║
║  - Expires: 2026-12-31                     ║
║  - Experience: 10 years                    ║
║                                             ║
║  Specializations:                           ║
║  [ABA] [CBT]                               ║
║                                             ║
║  Languages:                                 ║
║  English, Spanish                          ║
║                                             ║
║  Bio:                                       ║
║  Board-certified behavior analyst with...  ║
║                                             ║
║  [Edit Profile]  [Back to List]            ║
╚════════════════════════════════════════════╝
```

**Key UI Elements:**
- ✅ **Multi-step form**: Progressive disclosure (3 steps)
- ✅ **PHI encryption indicator**: Shows which fields are encrypted
- ✅ **Multi-select**: Specializations and Languages
- ✅ **Date picker**: License expiry
- ✅ **Validation**: Real-time with Zod
- ✅ **Responsive**: Mobile-friendly
- ✅ **Loading states**: Spinners during save
- ✅ **Error handling**: Clear error messages

---

## Database Verification

### Check PHI Encryption

```sql
-- Connect to database
docker exec -it therapy-clinic-postgres psql -U postgres -d therapy_clinic_dev

-- View encrypted therapist data
SELECT
  id,
  first_name_encrypted,
  last_name_encrypted,
  email_encrypted,
  phone_encrypted
FROM therapists
LIMIT 1;

-- Should see format: "dev-key-1:iv:authTag:ciphertext"
-- Example: "dev-key-1:a1b2c3:d4e5f6:g7h8i9"
```

### Check Audit Logs

```sql
-- View recent audit logs
SELECT
  action,
  resource,
  resource_id,
  user_id,
  phi_accessed,
  timestamp
FROM audit_logs
WHERE resource IN ('specialization', 'therapist')
ORDER BY timestamp DESC
LIMIT 10;

-- Should see logs for:
-- - SPECIALIZATION_CREATED
-- - SPECIALIZATION_UPDATED
-- - THERAPIST_CREATED
-- - THERAPIST_UPDATED
-- - PHI_ACCESSED (when viewing therapist details)
```

---

## Component Architecture

### Issue #14: Specializations

```
src/app/[locale]/(auth)/dashboard/admin/specializations/page.tsx
├─ SpecializationsList (component)
│  ├─ DataTable
│  │  ├─ Search input
│  │  ├─ Table rows
│  │  └─ Action buttons
│  ├─ CreateSpecializationDialog
│  │  └─ Form with Zod validation
│  └─ EditSpecializationDialog
│     └─ Pre-populated form
│
└─ API calls:
   ├─ GET /api/admin/specializations
   ├─ POST /api/admin/specializations
   ├─ PATCH /api/admin/specializations/[id]
   └─ DELETE /api/admin/specializations/[id]
```

### Issue #15: Therapists

```
src/app/[locale]/(auth)/dashboard/admin/therapists/page.tsx
├─ TherapistsList (component)
│  ├─ DataTable
│  │  ├─ Search/filter
│  │  ├─ Table rows
│  │  └─ Actions (View, Edit, Delete)
│  │
│  ├─ TherapistProfileForm.tsx
│  │  ├─ Step 1: Personal Info (PHI encrypted)
│  │  ├─ Step 2: Professional Info
│  │  ├─ Step 3: Specializations & Bio
│  │  └─ Form validation (React Hook Form + Zod)
│  │
│  └─ TherapistDetailView
│     └─ Read-only profile display
│
├─ Services:
│  └─ therapist.service.ts
│     ├─ createTherapist() - Encrypts PHI, logs audit
│     ├─ getTherapist() - Decrypts PHI
│     ├─ updateTherapist() - Re-encrypts, logs changes
│     └─ deleteTherapist() - Soft delete, audit log
│
└─ API calls:
   ├─ GET /api/admin/therapists
   ├─ POST /api/admin/therapists
   ├─ GET /api/admin/therapists/[id]
   ├─ PATCH /api/admin/therapists/[id]
   └─ DELETE /api/admin/therapists/[id]
```

---

## Testing Checklist

### Issue #14 ✅
- [ ] Navigate to specializations page
- [ ] Verify table renders
- [ ] Click "Add Specialization"
- [ ] Fill form and submit
- [ ] Verify new row appears
- [ ] Click Edit on a specialization
- [ ] Modify and save
- [ ] Verify changes persist
- [ ] Click Delete
- [ ] Confirm deletion
- [ ] Verify row removed
- [ ] Test search functionality

### Issue #15 ✅
- [ ] Navigate to therapists page
- [ ] Verify table renders
- [ ] Click "Add Therapist"
- [ ] Complete Step 1 (Personal Info)
- [ ] Complete Step 2 (Professional Info)
- [ ] Complete Step 3 (Specializations)
- [ ] Submit form
- [ ] Verify new therapist appears
- [ ] Click "View" on therapist
- [ ] Verify all data displays correctly
- [ ] Verify PHI is decrypted
- [ ] Click "Edit" on therapist
- [ ] Modify specializations
- [ ] Save changes
- [ ] Check database: PHI encrypted
- [ ] Check audit_logs: Actions logged

---

## Screenshots to Take

When you test, take screenshots of:

1. **Specializations List Page** (empty state)
2. **Add Specialization Form**
3. **Specializations List Page** (with data)
4. **Therapists List Page** (empty state)
5. **Add Therapist Form - Step 1**
6. **Add Therapist Form - Step 2**
7. **Add Therapist Form - Step 3**
8. **Therapists List Page** (with data)
9. **Therapist Detail View**
10. **Edit Therapist Form**

---

## Common Issues & Solutions

### "Page redirects to sign-in"
✅ **Expected behavior!** Admin pages require authentication.
- Solution: Log in with admin account

### "Specializations list is empty"
- Create some test specializations first
- Or check if database has data: `SELECT * FROM specializations;`

### "Can't select specializations in therapist form"
- Ensure specializations exist (Issue #14)
- Check API: `curl http://localhost:3000/api/admin/specializations`

### "PHI fields showing encrypted text"
- Check encryption service is initialized
- Verify PHI_ENCRYPTION_KEY in .env.local
- Check service layer is decrypting on read

### "Form validation not working"
- Open browser console for Zod errors
- Check all required fields are filled
- Verify email format, phone format

---

## Next: Issue #16

After confirming both UIs work:
1. **Issue #16**: Build Client Profile Management
   - Will mirror therapist profile implementation
   - PHI encryption for client data
   - Similar form structure
2. **Issue #17**: Build matching algorithm
   - Requires both client + therapist profiles
   - Match clients to therapists by specialization

