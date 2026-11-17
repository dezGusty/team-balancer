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
    players$: of([] as { id: number; name: string; stars: number }[])
  };

  const mockSettingsService = {
    showPlayerStatusIconsSig: signal(true),
    emailDistributionListSig: signal(['user1@example.com', 'user2@example.com']),
    getPreferredPlayerCount: () => 12
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
    mockPlayersService.players$ = of([]);
    mockGameEventsService.getMatchData.and.returnValue(of(null));

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

  it('should append (rez.) to voluntary reserves and involuntary reserves beyond 12 players', () => {
    const playerIds = Array.from({ length: 14 }, (_, i) => i + 1);
    const mockPlayers = playerIds.map(id => ({ id, name: `Player ${id}`, stars: 0 }));
    const reserveStatus = playerIds.map((_, i) => i === 2); // 3rd player is a voluntary reserve

    mockPlayersService.players$ = of(mockPlayers);
    mockGameEventsService.getMatchData.and.returnValue(of({
      matchDate: '2026-11-17',
      name: '2026-11-17_20:00',
      registeredPlayerIds: playerIds,
      playerReserveStatus: reserveStatus,
      inactive: false
    }));

    const localFixture = TestBed.createComponent(SummaryComponent);
    const localComponent = localFixture.componentInstance;
    localFixture.componentRef.setInput('availableEvents', [{ title: '2026-11-17_20:00', year: '2026', month: '11', day: '17', suffix: '20:00' }]);
    localFixture.detectChanges();

    const text = localComponent.generateSummaryText();
    expect(text).toContain('1. Player 1 \n');
    expect(text).toContain('3. Player 3  (rez.)\n');
    expect(text).toContain('12. Player 12 \n');
    expect(text).toContain('13. Player 13  (rez.)\n');
    expect(text).toContain('14. Player 14  (rez.)\n');

    const transposed = localComponent.transposedSignal();
    expect(transposed.players[0][0]).toBe('Player 1 ');
    expect(transposed.players[2][0]).toBe('Player 3  (rez.)');
    expect(transposed.players[11][0]).toBe('Player 12 ');
    expect(transposed.players[12][0]).toBe('Player 13  (rez.)');
    expect(transposed.players[13][0]).toBe('Player 14  (rez.)');
  });
});
