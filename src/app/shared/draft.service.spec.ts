import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Firestore } from '@angular/fire/firestore';
import { DraftService } from './draft.service';
import { UserAuthService } from '../auth/user-auth.service';
import { SettingsService } from './settings.service';
import { Player } from './player.model';

describe('DraftService', () => {
  let service: DraftService;
  let mockAuthSvc: any;
  let mockSettingsSvc: any;
  let mockFirestore: any;

  beforeEach(() => {
    mockAuthSvc = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      onSignInOut$: new Subject<string>()
    };

    mockSettingsSvc = {
      getPreferredPlayerCount: jasmine.createSpy('getPreferredPlayerCount').and.returnValue(12)
    };

    mockFirestore = {};

    TestBed.configureTestingModule({
      providers: [
        DraftService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: UserAuthService, useValue: mockAuthSvc },
        { provide: SettingsService, useValue: mockSettingsSvc }
      ]
    });
    service = TestBed.inject(DraftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store players in memory only', () => {
    const players: Player[] = [
      new Player(1, 'Player One'),
      new Player(2, 'Player Two')
    ];

    service.storePlayersInMemoryOnly(players);
    expect(service.getDraftedPlayers()).toEqual(players);
  });

  it('should format draft pretty text with line-up and reserves', () => {
    mockSettingsSvc.getPreferredPlayerCount.and.returnValue(2);
    const players: Player[] = [
      new Player(1, 'Alice'),
      new Player(2, 'Bob'),
      new Player(3, 'Charlie')
    ];

    const formatted = service.getDraftPlainTextFormat(players);
    expect(formatted).toContain('Main line-up ⚽');
    expect(formatted).toContain('1. Alice');
    expect(formatted).toContain('2. Bob');
    expect(formatted).toContain('Reserves 💺');
    expect(formatted).toContain('1. Charlie');
  });

  it('should format draft html format', () => {
    mockSettingsSvc.getPreferredPlayerCount.and.returnValue(2);
    const players: Player[] = [
      new Player(1, 'Alice'),
      new Player(2, 'Bob')
    ];

    const formatted = service.getDraftHtmlFormat(players);
    expect(formatted).toContain('<br>');
    expect(formatted).toContain('1. Alice');
  });
});
