import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryComponent } from './summary.component';
import { GameEventsService } from '../history/data-access/game-events.service';
import { PlayersService } from 'src/app/shared/players.service';
import { SettingsService } from 'src/app/shared/settings.service';
import { NotificationService } from 'src/app/utils/notification/notification.service';
import { EmailNotificationService } from 'src/app/shared/email-notification.service';
import { of, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';

describe('SummaryComponent', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  const mockGameEventsService = {
    updatedFireData$: new BehaviorSubject<boolean>(false),
    getMatchData: jasmine.createSpy('getMatchData').and.returnValue(of(null))
  };

  const mockPlayersService = {
    players$: of([])
  };

  const mockSettingsService = {
    showPlayerStatusIconsSig: signal(true),
    emailDistributionListSig: signal(['user1@example.com', 'user2@example.com'])
  };

  const mockNotificationService = {
    show: jasmine.createSpy('show')
  };

  const mockEmailService = {
    isConfigured: jasmine.createSpy('isConfigured').and.returnValue(true),
    getDistributionList: jasmine.createSpy('getDistributionList').and.returnValue(['user1@example.com', 'user2@example.com']),
    sendEmailUpdate: jasmine.createSpy('sendEmailUpdate').and.resolveTo({ success: true, message: 'ok' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryComponent],
      providers: [
        { provide: GameEventsService, useValue: mockGameEventsService },
        { provide: PlayersService, useValue: mockPlayersService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EmailNotificationService, useValue: mockEmailService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('availableEvents', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate empty summary text when no matches are active', () => {
    expect(component.generateSummaryText()).toBe('');
  });

  it('should fallback email subject when no matches are active', () => {
    expect(component.getEmailSubject()).toBe('[fotbal] ⚽ Update');
  });
});
