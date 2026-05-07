import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerifyEmail(to: string, verifyUrl: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Verify your BuildTrip account',
      html: `
        <h2>Welcome to BuildTrip</h2>
        <p>Please verify your email address to activate your account.</p>
        <p>
          <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">
            Verify email
          </a>
        </p>
        <p>This link expires in 24 hours.</p>
      `,
    });
    this.logger.log(`Sent verify email to ${to}`);
  }

  async sendResetPasswordEmail(to: string, resetUrl: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Reset your BuildTrip password',
      html: `
        <h2>Password reset request</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">
            Reset password
          </a>
        </p>
        <p>This link expires in 15 minutes.</p>
      `,
    });
    this.logger.log(`Sent reset password email to ${to}`);
  }

  async sendPlaceApprovedEmail(to: string, placeId: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Place approved',
      html: `
        <h2>Place approved</h2>
        <p>Your place has been approved and is now visible on the catalog.</p>
        <p><strong>Place ID:</strong> ${this.escapeHtml(placeId)}</p>
      `,
    });
    this.logger.log(`Sent place approved email to ${to}`);
  }

  async sendPlaceRejectedEmail(to: string, placeId: string, reason: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Place rejected',
      html: `
        <h2>Place rejected</h2>
        <p><strong>Place ID:</strong> ${this.escapeHtml(placeId)}</p>
        <p><strong>Reason:</strong> ${this.escapeHtml(reason)}</p>
      `,
    });
    this.logger.log(`Sent place rejected email to ${to}`);
  }

  async sendPlaceRequestSubmittedEmail(
    to: string,
    requestId: string,
    placeName: string,
    requesterUserId: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'New place request submitted',
      html: `
        <h2>New place request</h2>
        <p>A new place request needs moderation.</p>
        <p><strong>Request ID:</strong> ${this.escapeHtml(requestId)}</p>
        <p><strong>Place name:</strong> ${this.escapeHtml(placeName)}</p>
        <p><strong>Requester user ID:</strong> ${this.escapeHtml(requesterUserId)}</p>
      `,
    });
    this.logger.log(`Sent place request submitted email to ${to}`);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
