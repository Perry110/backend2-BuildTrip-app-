import { Injectable } from '@nestjs/common';
import { MailService } from '../../../common/mail/mail.service';
import type {
  PlaceApprovedNotificationPayload,
  PlaceRejectedNotificationPayload,
  PlaceRequestSubmittedNotificationPayload,
  ResetPasswordNotificationPayload,
  VerifyEmailNotificationPayload,
} from '../notification.types';

/**
 * Sends notification emails via {@link MailService} so verify/reset templates
 * stay identical to the rest of the app (including verify URL shape).
 */
@Injectable()
export class NotificationEmailService {
  constructor(private readonly mailService: MailService) {}

  async sendVerifyEmail(payload: VerifyEmailNotificationPayload): Promise<void> {
    await this.mailService.sendVerifyEmail(payload.to, payload.verifyUrl);
  }

  async sendResetPasswordEmail(
    payload: ResetPasswordNotificationPayload,
  ): Promise<void> {
    await this.mailService.sendResetPasswordEmail(payload.to, payload.resetUrl);
  }

  async sendPlaceApprovedEmail(
    payload: PlaceApprovedNotificationPayload,
  ): Promise<void> {
    await this.mailService.sendPlaceApprovedEmail(payload.to, payload.placeId);
  }

  async sendPlaceRejectedEmail(
    payload: PlaceRejectedNotificationPayload,
  ): Promise<void> {
    await this.mailService.sendPlaceRejectedEmail(
      payload.to,
      payload.placeId,
      payload.reason,
    );
  }

  async sendPlaceRequestSubmittedEmail(
    payload: PlaceRequestSubmittedNotificationPayload,
  ): Promise<void> {
    await this.mailService.sendPlaceRequestSubmittedEmail(
      payload.to,
      payload.requestId,
      payload.placeName,
      payload.requesterUserId,
    );
  }
}
