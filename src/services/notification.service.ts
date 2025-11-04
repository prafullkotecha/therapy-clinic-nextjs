/**
 * Notification Service
 * Handles sending notifications to users via email, SMS, etc.
 * Currently a placeholder for waitlist notifications
 */

export type NotificationPayload = {
  recipientId: string;
  subject: string;
  message: string;
  type: 'email' | 'sms' | 'push';
  metadata?: Record<string, unknown>;
};

/**
 * Send notification to a user
 * @param payload - Notification details
 * @returns Promise resolving to success status
 */
export async function sendNotification(
  payload: NotificationPayload,
): Promise<boolean> {
  // TODO: Integrate with SendGrid for email and Twilio for SMS
  // For now, use logger instead of console.log
  const { logger } = await import('@/libs/Logger');
  logger.info('[NOTIFICATION] Sending notification', {
    to: payload.recipientId,
    subject: payload.subject,
    type: payload.type,
    metadata: payload.metadata,
  });

  return true;
}

/**
 * Send waitlist notification to client
 * Notifies client that a slot matching their preferences is available
 */
export async function sendWaitlistNotification(
  clientId: string,
  therapistName: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  return sendNotification({
    recipientId: clientId,
    subject: 'Appointment Slot Available',
    message: `A slot with ${therapistName} is available on ${date} from ${startTime} to ${endTime}. Please respond within 24 hours to secure this appointment.`,
    type: 'email',
    metadata: {
      date,
      startTime,
      endTime,
      therapistName,
    },
  });
}
