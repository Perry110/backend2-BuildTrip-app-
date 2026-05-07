export const NOTIFICATION_QUEUE_NAME = 'notification';

export const NOTIFICATION_JOBS = {
  SEND_EMAIL: 'send-email',
} as const;

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'EMAIL',
} as const;

export const NOTIFICATION_TEMPLATES = {
  AUTH_VERIFY_EMAIL: 'auth_verify_email',
  AUTH_RESET_PASSWORD: 'auth_reset_password',
  PLACE_APPROVED: 'place_approved',
  PLACE_REJECTED: 'place_rejected',
  PLACE_REQUEST_SUBMITTED: 'place_request_submitted',
  /** In-app only: new or updated review on owner's published place */
  PLACE_REVIEW_ACTIVITY: 'place_review_activity',
} as const;

export const NOTIFICATION_PREFERENCE_TYPES = {
  PLACE_APPROVED: 'place_approved',
  PLACE_REJECTED: 'place_rejected',
} as const;

export const NOTIFICATION_STATUSES = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER',
} as const;
