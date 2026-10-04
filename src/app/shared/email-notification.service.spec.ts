import { TestBed } from '@angular/core/testing';
import { EmailNotificationService } from './email-notification.service';
import { SettingsService, DEFAULT_APP_SETTINGS } from './settings.service';
import { NotificationService } from '../utils/notification/notification.service';
import { signal } from '@angular/core';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;
  let mockSettingsSvc: any;
  let mockNotificationSvc: any;

  beforeEach(() => {
    mockSettingsSvc = {
      mailerScriptUrlSig: signal('https://script.google.com/macros/s/test/exec'),
      mailerSecretTokenSig: signal('test-secret'),
      emailDistributionListSig: signal(['player1@example.com', 'player2@example.com'])
    };

    mockNotificationSvc = {
      show: jasmine.createSpy('show'),
      emitMessage: jasmine.createSpy('emitMessage')
    };

    TestBed.configureTestingModule({
      providers: [
        EmailNotificationService,
        { provide: SettingsService, useValue: mockSettingsSvc },
        { provide: NotificationService, useValue: mockNotificationSvc }
      ]
    });

    service = TestBed.inject(EmailNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report isConfigured true when URL is present', () => {
    expect(service.isConfigured()).toBeTrue();
  });

  it('should report isConfigured false when URL is empty', () => {
    mockSettingsSvc.mailerScriptUrlSig.set('');
    expect(service.isConfigured()).toBeFalse();
  });

  it('should return distribution list from settings', () => {
    expect(service.getDistributionList()).toEqual(['player1@example.com', 'player2@example.com']);
  });

  it('should convert text to html with preserved formatting', () => {
    const html = service.convertTextToHtml('Line 1\nLine 2 & <tag>');
    expect(html).toContain('Line 1');
    expect(html).toContain('&amp;');
    expect(html).toContain('&lt;tag&gt;');
  });

  it('should fail gracefully if mailer URL is not configured', async () => {
    mockSettingsSvc.mailerScriptUrlSig.set('');
    const result = await service.sendEmailUpdate({
      subject: 'Test',
      plainText: 'Hello'
    });
    expect(result.success).toBeFalse();
    expect(mockNotificationSvc.show).toHaveBeenCalledWith(jasmine.stringMatching(/not configured/i));
  });

  it('should fail gracefully if distribution list is empty and no recipients provided', async () => {
    mockSettingsSvc.emailDistributionListSig.set([]);
    const result = await service.sendEmailUpdate({
      subject: 'Test',
      plainText: 'Hello'
    });
    expect(result.success).toBeFalse();
    expect(mockNotificationSvc.show).toHaveBeenCalledWith(jasmine.stringMatching(/no recipients/i));
  });
});
