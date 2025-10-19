import { supabase } from '@/integrations/supabase/client';

/**
 * Audit Logging Utility
 * Logs security-sensitive operations for compliance and monitoring
 */

export type AuditEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'profile_updated'
  | 'password_changed'
  | 'role_viewed'
  | 'sensitive_data_accessed'
  | 'file_uploaded'
  | 'file_downloaded'
  | 'permission_denied'
  | 'rate_limit_exceeded'
  | 'trip_status_change'
  | 'trip_assignment_change'
  | 'trip_created'
  | 'trip_updated';

interface AuditLogEntry {
  eventType: AuditEventType;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a security event to the database
 * @param entry - Audit log entry details
 */
export const logAuditEvent = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      if (import.meta.env.DEV) {
        console.warn('Cannot log audit event: User not authenticated');
      }
      return;
    }

    // Get IP address and user agent if available
    const ipAddress = entry.ipAddress || 'unknown';
    const userAgent = entry.userAgent || navigator.userAgent;

    await supabase.from('security_events').insert({
      user_id: user.id,
      event_type: entry.eventType,
      details: entry.details || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (import.meta.env.DEV) {
      console.log('Audit event logged:', entry.eventType);
    }
  } catch (error) {
    // Don't throw errors for audit logging failures
    // to avoid disrupting user operations
    if (import.meta.env.DEV) {
      console.error('Failed to log audit event:', error);
    }
  }
};

/**
 * Log a successful login
 */
export const logLogin = async () => {
  await logAuditEvent({
    eventType: 'login_success',
    details: { timestamp: new Date().toISOString() },
  });
};

/**
 * Log a failed login attempt
 */
export const logLoginFailed = async (email?: string) => {
  await logAuditEvent({
    eventType: 'login_failed',
    details: { email, timestamp: new Date().toISOString() },
  });
};

/**
 * Log a logout event
 */
export const logLogout = async () => {
  await logAuditEvent({
    eventType: 'logout',
    details: { timestamp: new Date().toISOString() },
  });
};

/**
 * Log profile updates
 */
export const logProfileUpdate = async (fields: string[]) => {
  await logAuditEvent({
    eventType: 'profile_updated',
    details: { 
      fields_updated: fields,
      timestamp: new Date().toISOString() 
    },
  });
};

/**
 * Log file upload events
 */
export const logFileUpload = async (fileName: string, fileSize: number, bucket: string) => {
  await logAuditEvent({
    eventType: 'file_uploaded',
    details: {
      file_name: fileName,
      file_size: fileSize,
      bucket,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Log rate limit exceeded events
 */
export const logRateLimitExceeded = async (operation: string) => {
  await logAuditEvent({
    eventType: 'rate_limit_exceeded',
    details: {
      operation,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Log permission denied events
 */
export const logPermissionDenied = async (resource: string, action: string) => {
  await logAuditEvent({
    eventType: 'permission_denied',
    details: {
      resource,
      action,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Log trip status changes
 */
export const logTripStatusChange = async (
  tripId: string, 
  oldStatus: string, 
  newStatus: string, 
  additionalDetails?: Record<string, any>
) => {
  await logAuditEvent({
    eventType: 'trip_status_change',
    details: {
      trip_id: tripId,
      old_status: oldStatus,
      new_status: newStatus,
      timestamp: new Date().toISOString(),
      ...additionalDetails,
    },
  });
};

/**
 * Log trip resource assignment changes
 */
export const logTripAssignmentChange = async (
  tripId: string,
  assignmentType: 'driver' | 'vehicle',
  resourceId: string,
  resourceName: string
) => {
  await logAuditEvent({
    eventType: 'trip_assignment_change',
    details: {
      trip_id: tripId,
      assignment_type: assignmentType,
      resource_id: resourceId,
      resource_name: resourceName,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Log trip creation
 */
export const logTripCreated = async (tripId: string, tripDetails: Record<string, any>) => {
  await logAuditEvent({
    eventType: 'trip_created',
    details: {
      trip_id: tripId,
      ...tripDetails,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Log trip updates
 */
export const logTripUpdated = async (tripId: string, updatedFields: string[]) => {
  await logAuditEvent({
    eventType: 'trip_updated',
    details: {
      trip_id: tripId,
      fields_updated: updatedFields,
      timestamp: new Date().toISOString(),
    },
  });
};
