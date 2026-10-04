import { inject, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { NotificationService } from '../utils/notification/notification.service';

export interface EmailPayload {
  subject: string;
  plainText: string;
  htmlContent?: string;
  recipients?: string[];
  senderName?: string;
}

export interface EmailSendResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailNotificationService {
  private readonly settingsSvc = inject(SettingsService);
  private readonly notificationSvc = inject(NotificationService);

  /**
   * Returns true if the mailer Web App URL is configured in settings.
   */
  public isConfigured(): boolean {
    const url = this.settingsSvc.mailerScriptUrlSig();
    return typeof url === 'string' && url.trim().length > 0;
  }

  /**
   * Retrieves the configured recipient list from AppSettings.
   */
  public getDistributionList(): string[] {
    return this.settingsSvc.emailDistributionListSig();
  }

  /**
   * Dispatches an email update to the distribution list or specified recipients.
   * Note: As configured, all recipients are passed in the 'to' field so they can see each other.
   */
  public async sendEmailUpdate(payload: EmailPayload): Promise<EmailSendResult> {
    const url = this.settingsSvc.mailerScriptUrlSig()?.trim();
    const secret = this.settingsSvc.mailerSecretTokenSig()?.trim();

    if (!url) {
      const msg = 'Mailer script URL is not configured. Please set it in Admin Settings.';
      this.notificationSvc.show(msg);
      return { success: false, message: msg };
    }

    const recipients = (payload.recipients && payload.recipients.length > 0)
      ? payload.recipients
      : this.getDistributionList();

    if (!recipients || recipients.length === 0) {
      const msg = 'No recipients in the email distribution list.';
      this.notificationSvc.show(msg);
      return { success: false, message: msg };
    }

    const bodyData = {
      secret: secret ?? '',
      recipients: recipients,
      subject: payload.subject,
      plainBody: payload.plainText,
      htmlBody: payload.htmlContent || this.convertTextToHtml(payload.plainText),
      senderName: payload.senderName || 'Team Balancer'
    };

    try {
      // Send with text/plain to avoid CORS preflight (OPTIONS) which Google Apps Script does not support.
      // Google Apps Script will parse e.postData.contents as JSON and redirect to script.googleusercontent.com.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        const msg = `Email successfully sent to ${recipients.length} recipient(s).`;
        this.notificationSvc.show(msg);
        return { success: true, message: msg };
      } else {
        const errorMsg = result.message || result.error || 'Unknown error returned from mailer script.';
        this.notificationSvc.show(`Failed to send email: ${errorMsg}`);
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      console.error('Error sending email update:', err);
      const errorMsg = err?.message || 'Network error while contacting mailer script.';
      this.notificationSvc.show(`Error sending email: ${errorMsg}`);
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Helper to send a quick test email to verify Google Apps Script connectivity.
   */
  public async sendTestEmail(testRecipient: string): Promise<EmailSendResult> {
    const trimmed = testRecipient.trim();
    if (!trimmed) {
      const msg = 'Please enter a test email recipient.';
      this.notificationSvc.show(msg);
      return { success: false, message: msg };
    }

    return this.sendEmailUpdate({
      subject: '⚽ Team Balancer: Test Email',
      plainText: `This is a test email sent from Team Balancer to verify your Google Apps Script integration.\r\nTimestamp: ${new Date().toLocaleString()}`,
      recipients: [trimmed]
    });
  }

  /**
   * Convert plain text lines into clean HTML formatting.
   */
  public convertTextToHtml(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222;">
      <pre style="font-family: inherit; white-space: pre-wrap; margin: 0;">${escaped}</pre>
    </div>`;
  }
}
