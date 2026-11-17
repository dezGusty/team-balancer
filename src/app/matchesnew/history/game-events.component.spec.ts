import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { GameEventsComponent } from './game-events.component';
import { GameEventsService } from './data-access/game-events.service';
import { MatchDateTitle } from './match-date-title';
import { MatchDaySchedule, SettingsService } from 'src/app/shared/settings.service';
import { FormAction } from '../form-edit-wrapper';
import { CreateGameRequest } from './data-access/create-game-request.model';

describe('GameEventsComponent', () => {
  let component: GameEventsComponent;
  let fixture: ComponentFixture<GameEventsComponent>;

  const recentGameTitlesSig = signal<MatchDateTitle[]>([]);
  const defaultMatchScheduleSig = signal<MatchDaySchedule[]>([
    { dayOfWeek: 2, time: '20:00' },
    { dayOfWeek: 4, time: '19:00' },
  ]);

  const mockGameEventsService = {
    recentGameTitlesSig,
    selectedMatchSig: signal<MatchDateTitle | null>(null),
    selectedMatchContent: signal(null),
    selectedMatchSubject$: new Subject<MatchDateTitle>(),
    createGameEvent: jasmine.createSpy('createGameEvent'),
  };

  const mockSettingsService = {
    defaultMatchScheduleSig,
  };

  beforeEach(async () => {
    recentGameTitlesSig.set([]);
    defaultMatchScheduleSig.set([
      { dayOfWeek: 2, time: '20:00' },
      { dayOfWeek: 4, time: '19:00' },
    ]);

    jasmine.clock().install();
    // Monday, 2026-11-16
    jasmine.clock().mockDate(new Date(2026, 10, 16, 12, 0, 0));

    await TestBed.configureTestingModule({
      imports: [GameEventsComponent],
      providers: [
        { provide: GameEventsService, useValue: mockGameEventsService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    })
      .overrideComponent(GameEventsComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GameEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should select the nearest scheduled date/time when no games exist', () => {
    component.onAddGameClicked();
    component.selectNextGameDay();

    expect(component.addEvent().matchDate).toBe('2026-11-17');
    expect(component.addEvent().suffix).toBe('20:00');
  });

  it('should skip an already created game and select the next available date/time combo', () => {
    recentGameTitlesSig.set([MatchDateTitle.fromString('2026-11-17_20:00')]);

    component.onAddGameClicked();
    component.selectNextGameDay();

    expect(component.addEvent().matchDate).toBe('2026-11-19');
    expect(component.addEvent().suffix).toBe('19:00');
  });

  it('should scan beyond 7 days when multiple upcoming scheduled slots are already taken', () => {
    recentGameTitlesSig.set([
      MatchDateTitle.fromString('2026-11-17_20:00'),
      MatchDateTitle.fromString('2026-11-19_19:00'),
      MatchDateTitle.fromString('2026-11-24_20:00'),
    ]);

    component.onAddGameClicked();
    component.selectNextGameDay();

    expect(component.addEvent().matchDate).toBe('2026-11-26');
    expect(component.addEvent().suffix).toBe('19:00');
  });

  it('should pick another available time slot on the same day when multiple times are scheduled', () => {
    defaultMatchScheduleSig.set([
      { dayOfWeek: 2, time: '18:00' },
      { dayOfWeek: 2, time: '20:00' },
      { dayOfWeek: 4, time: '19:00' },
    ]);
    recentGameTitlesSig.set([MatchDateTitle.fromString('2026-11-17_18:00')]);

    component.onAddGameClicked();
    component.selectNextGameDay();

    expect(component.addEvent().matchDate).toBe('2026-11-17');
    expect(component.addEvent().suffix).toBe('20:00');
  });

  it('should advance to the next available slot when selectNextGameDay is clicked repeatedly', () => {
    recentGameTitlesSig.set([MatchDateTitle.fromString('2026-11-19_19:00')]);

    component.onAddGameClicked();
    component.selectNextGameDay();
    expect(component.addEvent().matchDate).toBe('2026-11-17');
    expect(component.addEvent().suffix).toBe('20:00');

    component.selectNextGameDay();
    expect(component.addEvent().matchDate).toBe('2026-11-24');
    expect(component.addEvent().suffix).toBe('20:00');
  });

  it('should skip already created dates in fallback mode when schedule is empty', () => {
    defaultMatchScheduleSig.set([]);
    recentGameTitlesSig.set([MatchDateTitle.fromString('2026-11-17_20:00')]);

    component.addEvent.set({ action: FormAction.Add } as unknown as CreateGameRequest & { action: FormAction });
    component.selectNextGameDay();

    expect(component.addEvent().matchDate).toBe('2026-11-19');
  });
});
