import type {
  ClientQueryParams,
  CreateClientInput,
  CreateClientNeedsInput,
  UpdateClientInput,
  UpdateClientNeedsInput,
} from '@/validations/client.validation';
import { and, eq, sql } from 'drizzle-orm';
import { getEncryptionServiceSync } from '@/lib/encryption';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { clientNeeds, clients } from '@/models/client.schema';
import { therapists } from '@/models/therapist.schema';
import { logAudit } from '@/services/audit.service';

/**
 * Client Service
 * Handles business logic for client profile management
 *
 * IMPORTANT: All PHI fields must be encrypted before storage and decrypted after retrieval
 */

type ClientWithDetails = {
  id: string;
  tenantId: string;
  primaryLocationId: string | null;
  firstName: string; // Encrypted in DB
  lastName: string; // Encrypted in DB
  dateOfBirth: string; // Encrypted in DB
  ssn: string | null; // Encrypted in DB
  email: string | null; // Encrypted in DB
  phone: string | null; // Encrypted in DB
  address: string | null; // Encrypted in DB
  ageGroup: string | null;
  preferredLanguage: string | null;
  guardianName: string | null; // Encrypted in DB
  guardianRelationship: string | null;
  guardianPhone: string | null; // Encrypted in DB
  guardianEmail: string | null; // Encrypted in DB
  emergencyContactName: string | null; // Encrypted in DB
  emergencyContactPhone: string | null; // Encrypted in DB
  emergencyContactRelationship: string | null;
  insuranceProvider: string | null; // Encrypted in DB
  insurancePolicyNumber: string | null; // Encrypted in DB
  insuranceGroupNumber: string | null; // Encrypted in DB
  status: string | null;
  intakeDate: string | null;
  dischargeDate: string | null;
  assignedTherapistId: string | null;
  matchScore: number | null;
  matchReasoning: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  therapist?: {
    id: string;
    userId: string;
    credentials: string | null;
  };
  needs?: ClientNeedsWithDetails;
};

type ClientNeedsWithDetails = {
  id: string;
  tenantId: string;
  clientId: string;
  primaryConcerns: string | null; // Encrypted in DB
  behavioralCharacteristics: string | null; // Encrypted in DB
  sensoryConsiderations: string | null; // Encrypted in DB
  communicationNeeds: string | null;
  cooccurringConditions: unknown;
  requiredSpecializations: unknown;
  preferredTherapyModality: string | null;
  schedulePreferences: unknown;
  urgencyLevel: string | null;
  assessmentDate: Date;
  assessedBy: string | null;
  nextReassessment: string | null;
};

/**
 * Create a new client profile
 */
export async function createClient(
  tenantId: string,
  userId: string,
  data: CreateClientInput,
): Promise<ClientWithDetails> {
  return await withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    // Encrypt PHI fields
    const encryptedData = {
      tenantId,
      primaryLocationId: data.primaryLocationId || null,
      firstName: encryption.encrypt(data.firstName),
      lastName: encryption.encrypt(data.lastName),
      dateOfBirth: encryption.encrypt(data.dateOfBirth),
      ssn: data.ssn ? encryption.encrypt(data.ssn) : null,
      email: data.email ? encryption.encrypt(data.email) : null,
      phone: data.phone ? encryption.encrypt(data.phone) : null,
      address: data.address ? encryption.encrypt(data.address) : null,
      ageGroup: data.ageGroup || null,
      preferredLanguage: data.preferredLanguage || 'English',
      guardianName: data.guardianName ? encryption.encrypt(data.guardianName) : null,
      guardianRelationship: data.guardianRelationship || null,
      guardianPhone: data.guardianPhone ? encryption.encrypt(data.guardianPhone) : null,
      guardianEmail: data.guardianEmail ? encryption.encrypt(data.guardianEmail) : null,
      emergencyContactName: data.emergencyContactName ? encryption.encrypt(data.emergencyContactName) : null,
      emergencyContactPhone: data.emergencyContactPhone ? encryption.encrypt(data.emergencyContactPhone) : null,
      emergencyContactRelationship: data.emergencyContactRelationship || null,
      insuranceProvider: data.insuranceProvider ? encryption.encrypt(data.insuranceProvider) : null,
      insurancePolicyNumber: data.insurancePolicyNumber ? encryption.encrypt(data.insurancePolicyNumber) : null,
      insuranceGroupNumber: data.insuranceGroupNumber ? encryption.encrypt(data.insuranceGroupNumber) : null,
      status: data.status || 'intake',
      intakeDate: data.intakeDate || new Date().toISOString().split('T')[0],
      createdBy: userId,
    };

    // Create client profile
    const [newClient] = await db
      .insert(clients)
      .values(encryptedData)
      .returning();

    if (!newClient) {
      throw new Error('Failed to create client profile');
    }

    // Log PHI access for audit
    await logAudit(tenantId, {
      userId,
      action: 'create',
      resource: 'client',
      resourceId: newClient.id,
      phiAccessed: true,
      metadata: {
        fields: ['firstName', 'lastName', 'dateOfBirth', 'email', 'phone'],
      },
    });

    // Fetch and return the complete client profile
    return await getClientById(tenantId, userId, newClient.id);
  });
}

/**
 * Create client needs/assessment
 */
export async function createClientNeeds(
  tenantId: string,
  userId: string,
  data: CreateClientNeedsInput,
): Promise<ClientNeedsWithDetails> {
  return await withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    // Verify client exists
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, data.clientId), eq(clients.tenantId, tenantId)))
      .limit(1);

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if needs already exist
    const [existing] = await db
      .select()
      .from(clientNeeds)
      .where(and(eq(clientNeeds.clientId, data.clientId), eq(clientNeeds.tenantId, tenantId)))
      .limit(1);

    if (existing) {
      throw new Error('Client needs already exist for this client');
    }

    // Encrypt PHI fields
    const encryptedData = {
      tenantId,
      clientId: data.clientId,
      primaryConcerns: data.primaryConcerns ? encryption.encrypt(data.primaryConcerns) : null,
      behavioralCharacteristics: data.behavioralCharacteristics ? encryption.encrypt(data.behavioralCharacteristics) : null,
      sensoryConsiderations: data.sensoryConsiderations ? encryption.encrypt(data.sensoryConsiderations) : null,
      communicationNeeds: data.communicationNeeds || null,
      cooccurringConditions: data.cooccurringConditions || [],
      requiredSpecializations: data.requiredSpecializations || [],
      preferredTherapyModality: data.preferredTherapyModality || null,
      schedulePreferences: data.schedulePreferences || null,
      urgencyLevel: data.urgencyLevel || 'standard',
      assessedBy: userId,
    };

    // Create client needs
    const [newNeeds] = await db
      .insert(clientNeeds)
      .values(encryptedData)
      .returning();

    if (!newNeeds) {
      throw new Error('Failed to create client needs');
    }

    // Log PHI access
    await logAudit(tenantId, {
      userId,
      action: 'create',
      resource: 'client_needs',
      resourceId: newNeeds.id,
      phiAccessed: true,
      metadata: {
        clientId: data.clientId,
      },
    });

    // Return decrypted needs
    return decryptClientNeeds(newNeeds);
  });
}

/**
 * Get client by ID with therapist and needs
 */
export async function getClientById(
  tenantId: string,
  userId: string,
  clientId: string,
): Promise<ClientWithDetails> {
  return await withTenantContext(tenantId, async () => {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
      .limit(1);

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch therapist if assigned
    let therapist;
    if (client.assignedTherapistId) {
      [therapist] = await db
        .select({
          id: therapists.id,
          userId: therapists.userId,
          credentials: therapists.credentials,
        })
        .from(therapists)
        .where(and(eq(therapists.id, client.assignedTherapistId), eq(therapists.tenantId, tenantId)))
        .limit(1);
    }

    // Fetch needs
    const [needs] = await db
      .select()
      .from(clientNeeds)
      .where(and(eq(clientNeeds.clientId, clientId), eq(clientNeeds.tenantId, tenantId)))
      .limit(1);

    // Log PHI access
    await logAudit(tenantId, {
      userId,
      action: 'read',
      resource: 'client',
      resourceId: clientId,
      phiAccessed: true,
    });

    // Decrypt and return
    return {
      ...decryptClient(client),
      therapist,
      needs: needs ? decryptClientNeeds(needs) : undefined,
    };
  });
}

/**
 * List all clients with optional filtering
 */
export async function listClients(
  tenantId: string,
  userId: string,
  params?: ClientQueryParams,
): Promise<ClientWithDetails[]> {
  return await withTenantContext(tenantId, async () => {
    const conditions = [eq(clients.tenantId, tenantId)];

    if (params?.status) {
      conditions.push(eq(clients.status, params.status));
    }
    if (params?.locationId) {
      conditions.push(eq(clients.primaryLocationId, params.locationId));
    }
    if (params?.assignedTherapistId) {
      conditions.push(eq(clients.assignedTherapistId, params.assignedTherapistId));
    }

    const clientsList = await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(sql`${clients.createdAt} DESC`);

    // Log PHI access
    await logAudit(tenantId, {
      userId,
      action: 'read',
      resource: 'clients',
      phiAccessed: true,
      metadata: {
        count: clientsList.length,
        filters: params,
      },
    });

    // Decrypt all clients
    return clientsList.map(client => decryptClient(client));
  });
}

/**
 * Update client profile
 */
export async function updateClient(
  tenantId: string,
  userId: string,
  clientId: string,
  data: UpdateClientInput,
): Promise<ClientWithDetails> {
  return await withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    // Verify client exists
    const [existing] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      throw new Error('Client not found');
    }

    // Prepare update data with encryption for PHI fields
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.primaryLocationId !== undefined) {
      updateData.primaryLocationId = data.primaryLocationId;
    }
    if (data.firstName) {
      updateData.firstName = encryption.encrypt(data.firstName);
    }
    if (data.lastName) {
      updateData.lastName = encryption.encrypt(data.lastName);
    }
    if (data.dateOfBirth) {
      updateData.dateOfBirth = encryption.encrypt(data.dateOfBirth);
    }
    if (data.ssn !== undefined) {
      updateData.ssn = data.ssn ? encryption.encrypt(data.ssn) : null;
    }
    if (data.email !== undefined) {
      updateData.email = data.email ? encryption.encrypt(data.email) : null;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone ? encryption.encrypt(data.phone) : null;
    }
    if (data.address !== undefined) {
      updateData.address = data.address ? encryption.encrypt(data.address) : null;
    }
    if (data.ageGroup !== undefined) {
      updateData.ageGroup = data.ageGroup;
    }
    if (data.preferredLanguage) {
      updateData.preferredLanguage = data.preferredLanguage;
    }
    if (data.guardianName !== undefined) {
      updateData.guardianName = data.guardianName ? encryption.encrypt(data.guardianName) : null;
    }
    if (data.guardianRelationship !== undefined) {
      updateData.guardianRelationship = data.guardianRelationship;
    }
    if (data.guardianPhone !== undefined) {
      updateData.guardianPhone = data.guardianPhone ? encryption.encrypt(data.guardianPhone) : null;
    }
    if (data.guardianEmail !== undefined) {
      updateData.guardianEmail = data.guardianEmail ? encryption.encrypt(data.guardianEmail) : null;
    }
    if (data.emergencyContactName !== undefined) {
      updateData.emergencyContactName = data.emergencyContactName ? encryption.encrypt(data.emergencyContactName) : null;
    }
    if (data.emergencyContactPhone !== undefined) {
      updateData.emergencyContactPhone = data.emergencyContactPhone ? encryption.encrypt(data.emergencyContactPhone) : null;
    }
    if (data.emergencyContactRelationship !== undefined) {
      updateData.emergencyContactRelationship = data.emergencyContactRelationship;
    }
    if (data.insuranceProvider !== undefined) {
      updateData.insuranceProvider = data.insuranceProvider ? encryption.encrypt(data.insuranceProvider) : null;
    }
    if (data.insurancePolicyNumber !== undefined) {
      updateData.insurancePolicyNumber = data.insurancePolicyNumber ? encryption.encrypt(data.insurancePolicyNumber) : null;
    }
    if (data.insuranceGroupNumber !== undefined) {
      updateData.insuranceGroupNumber = data.insuranceGroupNumber ? encryption.encrypt(data.insuranceGroupNumber) : null;
    }
    if (data.status) {
      updateData.status = data.status;
    }
    if (data.intakeDate !== undefined) {
      updateData.intakeDate = data.intakeDate;
    }
    if (data.dischargeDate !== undefined) {
      updateData.dischargeDate = data.dischargeDate;
    }
    if (data.assignedTherapistId !== undefined) {
      updateData.assignedTherapistId = data.assignedTherapistId;
    }

    // Update client
    await db
      .update(clients)
      .set(updateData)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)));

    // Log PHI access
    await logAudit(tenantId, {
      userId,
      action: 'update',
      resource: 'client',
      resourceId: clientId,
      phiAccessed: true,
      metadata: {
        updatedFields: Object.keys(data),
      },
    });

    // Return updated client
    return await getClientById(tenantId, userId, clientId);
  });
}

/**
 * Update client needs
 */
export async function updateClientNeeds(
  tenantId: string,
  userId: string,
  clientId: string,
  data: UpdateClientNeedsInput,
): Promise<ClientNeedsWithDetails> {
  return await withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    // Verify needs exist
    const [existing] = await db
      .select()
      .from(clientNeeds)
      .where(and(eq(clientNeeds.clientId, clientId), eq(clientNeeds.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      throw new Error('Client needs not found');
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    if (data.primaryConcerns !== undefined) {
      updateData.primaryConcerns = data.primaryConcerns ? encryption.encrypt(data.primaryConcerns) : null;
    }
    if (data.behavioralCharacteristics !== undefined) {
      updateData.behavioralCharacteristics = data.behavioralCharacteristics ? encryption.encrypt(data.behavioralCharacteristics) : null;
    }
    if (data.sensoryConsiderations !== undefined) {
      updateData.sensoryConsiderations = data.sensoryConsiderations ? encryption.encrypt(data.sensoryConsiderations) : null;
    }
    if (data.communicationNeeds !== undefined) {
      updateData.communicationNeeds = data.communicationNeeds;
    }
    if (data.cooccurringConditions) {
      updateData.cooccurringConditions = data.cooccurringConditions;
    }
    if (data.requiredSpecializations) {
      updateData.requiredSpecializations = data.requiredSpecializations;
    }
    if (data.preferredTherapyModality !== undefined) {
      updateData.preferredTherapyModality = data.preferredTherapyModality;
    }
    if (data.schedulePreferences !== undefined) {
      updateData.schedulePreferences = data.schedulePreferences;
    }
    if (data.urgencyLevel) {
      updateData.urgencyLevel = data.urgencyLevel;
    }

    // Update needs
    const [updated] = await db
      .update(clientNeeds)
      .set(updateData)
      .where(and(eq(clientNeeds.id, existing.id), eq(clientNeeds.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Failed to update client needs');
    }

    // Log PHI access
    await logAudit(tenantId, {
      userId,
      action: 'update',
      resource: 'client_needs',
      resourceId: existing.id,
      phiAccessed: true,
      metadata: {
        clientId,
      },
    });

    return decryptClientNeeds(updated);
  });
}

/**
 * Delete client profile
 */
export async function deleteClient(
  tenantId: string,
  userId: string,
  clientId: string,
): Promise<void> {
  return await withTenantContext(tenantId, async () => {
    // Verify client exists
    const [existing] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      throw new Error('Client not found');
    }

    // Delete client needs first (foreign key constraint)
    await db
      .delete(clientNeeds)
      .where(and(eq(clientNeeds.clientId, clientId), eq(clientNeeds.tenantId, tenantId)));

    // Delete client
    await db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)));

    // Log PHI access
    await logAudit(tenantId, {
      userId,
      action: 'delete',
      resource: 'client',
      resourceId: clientId,
      phiAccessed: true,
    });
  });
}

/**
 * Helper: Decrypt client PHI fields
 */
function decryptClient(encryptedClient: any): ClientWithDetails {
  const encryption = getEncryptionServiceSync();

  return {
    id: encryptedClient.id,
    tenantId: encryptedClient.tenantId,
    primaryLocationId: encryptedClient.primaryLocationId,
    firstName: encryption.decrypt(encryptedClient.firstName),
    lastName: encryption.decrypt(encryptedClient.lastName),
    dateOfBirth: encryption.decrypt(encryptedClient.dateOfBirth),
    ssn: encryptedClient.ssn ? encryption.decrypt(encryptedClient.ssn) : null,
    email: encryptedClient.email ? encryption.decrypt(encryptedClient.email) : null,
    phone: encryptedClient.phone ? encryption.decrypt(encryptedClient.phone) : null,
    address: encryptedClient.address ? encryption.decrypt(encryptedClient.address) : null,
    ageGroup: encryptedClient.ageGroup,
    preferredLanguage: encryptedClient.preferredLanguage,
    guardianName: encryptedClient.guardianName ? encryption.decrypt(encryptedClient.guardianName) : null,
    guardianRelationship: encryptedClient.guardianRelationship,
    guardianPhone: encryptedClient.guardianPhone ? encryption.decrypt(encryptedClient.guardianPhone) : null,
    guardianEmail: encryptedClient.guardianEmail ? encryption.decrypt(encryptedClient.guardianEmail) : null,
    emergencyContactName: encryptedClient.emergencyContactName ? encryption.decrypt(encryptedClient.emergencyContactName) : null,
    emergencyContactPhone: encryptedClient.emergencyContactPhone ? encryption.decrypt(encryptedClient.emergencyContactPhone) : null,
    emergencyContactRelationship: encryptedClient.emergencyContactRelationship,
    insuranceProvider: encryptedClient.insuranceProvider ? encryption.decrypt(encryptedClient.insuranceProvider) : null,
    insurancePolicyNumber: encryptedClient.insurancePolicyNumber ? encryption.decrypt(encryptedClient.insurancePolicyNumber) : null,
    insuranceGroupNumber: encryptedClient.insuranceGroupNumber ? encryption.decrypt(encryptedClient.insuranceGroupNumber) : null,
    status: encryptedClient.status,
    intakeDate: encryptedClient.intakeDate,
    dischargeDate: encryptedClient.dischargeDate,
    assignedTherapistId: encryptedClient.assignedTherapistId,
    matchScore: encryptedClient.matchScore,
    matchReasoning: encryptedClient.matchReasoning,
    createdAt: encryptedClient.createdAt,
    updatedAt: encryptedClient.updatedAt,
    createdBy: encryptedClient.createdBy,
  };
}

/**
 * List clients for a specific therapist (only their assigned clients)
 */
export async function listClientsForTherapist(
  tenantId: string,
  therapistId: string,
  userId: string,
): Promise<ClientWithDetails[]> {
  return await withTenantContext(tenantId, async () => {
    // Find therapist record by userId
    const [therapist] = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.userId, therapistId), eq(therapists.tenantId, tenantId)))
      .limit(1);

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    // Fetch only assigned clients
    const clientsList = await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.tenantId, tenantId),
        eq(clients.assignedTherapistId, therapist.id),
      ))
      .orderBy(sql`${clients.createdAt} DESC`);

    // Log PHI access
    await logAudit(tenantId, {
      userId,
      action: 'read',
      resource: 'clients',
      phiAccessed: true,
      metadata: {
        count: clientsList.length,
        therapistId: therapist.id,
      },
    });

    // Decrypt all clients
    return clientsList.map(client => decryptClient(client));
  });
}

/**
 * Filter client fields based on user role
 * Removes sensitive fields that the role should not see
 */
export function filterClientFieldsByRole(client: ClientWithDetails, role: string): Partial<ClientWithDetails> {
  const baseFields = {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    status: client.status,
  };

  switch (role) {
    case 'therapist':
      // Therapist: clinical focus, no insurance or SSN
      return {
        ...baseFields,
        dateOfBirth: client.dateOfBirth,
        ageGroup: client.ageGroup,
        preferredLanguage: client.preferredLanguage,
        guardianName: client.guardianName,
        guardianRelationship: client.guardianRelationship,
        guardianPhone: client.guardianPhone,
        guardianEmail: client.guardianEmail,
        emergencyContactName: client.emergencyContactName,
        emergencyContactPhone: client.emergencyContactPhone,
        emergencyContactRelationship: client.emergencyContactRelationship,
        intakeDate: client.intakeDate,
        assignedTherapistId: client.assignedTherapistId,
        therapist: client.therapist,
        needs: client.needs,
      };

    case 'billing':
      // Billing: insurance focus, limited clinical info
      return {
        ...baseFields,
        insuranceProvider: client.insuranceProvider,
        insurancePolicyNumber: client.insurancePolicyNumber,
        insuranceGroupNumber: client.insuranceGroupNumber,
        assignedTherapistId: client.assignedTherapistId,
      };

    case 'receptionist':
      // Receptionist: contact and scheduling focus
      return {
        ...baseFields,
        ageGroup: client.ageGroup,
        preferredLanguage: client.preferredLanguage,
        primaryLocationId: client.primaryLocationId,
        assignedTherapistId: client.assignedTherapistId,
        intakeDate: client.intakeDate,
      };

    case 'admin':
    default:
      // Admin: full access
      return client;
  }
}

/**
 * Helper: Decrypt client needs PHI fields
 */
function decryptClientNeeds(encryptedNeeds: any): ClientNeedsWithDetails {
  const encryption = getEncryptionServiceSync();

  return {
    id: encryptedNeeds.id,
    tenantId: encryptedNeeds.tenantId,
    clientId: encryptedNeeds.clientId,
    primaryConcerns: encryptedNeeds.primaryConcerns ? encryption.decrypt(encryptedNeeds.primaryConcerns) : null,
    behavioralCharacteristics: encryptedNeeds.behavioralCharacteristics ? encryption.decrypt(encryptedNeeds.behavioralCharacteristics) : null,
    sensoryConsiderations: encryptedNeeds.sensoryConsiderations ? encryption.decrypt(encryptedNeeds.sensoryConsiderations) : null,
    communicationNeeds: encryptedNeeds.communicationNeeds,
    cooccurringConditions: encryptedNeeds.cooccurringConditions,
    requiredSpecializations: encryptedNeeds.requiredSpecializations,
    preferredTherapyModality: encryptedNeeds.preferredTherapyModality,
    schedulePreferences: encryptedNeeds.schedulePreferences,
    urgencyLevel: encryptedNeeds.urgencyLevel,
    assessmentDate: encryptedNeeds.assessmentDate,
    assessedBy: encryptedNeeds.assessedBy,
    nextReassessment: encryptedNeeds.nextReassessment,
  };
}
