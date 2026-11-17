import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { NextDraftComponent } from './nextdraft.component';
import { DraftSelectionData, DraftSelectionService } from './data-access/draft-selection.service';
import { CurrentPlayersData, CurrentPlayersService } from './data-access/current-players.service';
import { NotificationService } from '../utils/notification/notification.service';
import { DraftService } from '../shared/draft.service';
import { Player } from '../shared/player.model';

describe('NextDraftComponent', () => {
  let component: NextDraftComponent;
  let fixture: ComponentFixture<NextDraftComponent>;

  const player1 = { id: 1, name: 'Alice', stars: 0 } as Player;
  const player2 = { id: 2, name: 'Bob', stars: 0 } as Player;
  const player3 = { id: 3, name: 'Charlie', stars: 0 } as Player;

  let nextMatchDraft$: BehaviorSubject<DraftSelectionData>;
  let currentPlayers$: BehaviorSubject<CurrentPlayersData>;

  beforeEach(async () => {
    nextMatchDraft$ = new BehaviorSubject<DraftSelectionData>({ players: [player1] });
    currentPlayers$ = new BehaviorSubject<CurrentPlayersData>({
      players: [player1, player2, player3],
      label: 'Test',
      version: 1,
    });

    const mockDraftSelectionService = {
      nextMatchDraft$: nextMatchDraft$.asObservable(),
      triggerDataRetrieval$: new BehaviorSubject<boolean>(true),
      triggerStoreMatchSubject$: new Subject<DraftSelectionData>(),
      getDraftPlainTextFormat: jasmine.createSpy('getDraftPlainTextFormat').and.returnValue(''),
    };

    const mockCurrentPlayersService = {
      currentPlayers$: currentPlayers$.asObservable(),
      triggerDataRetrieval$: new BehaviorSubject<boolean>(true),
    };

    const mockNotificationService = {
      emitMessage: jasmine.createSpy('emitMessage'),
    };

    const mockDraftService = {
      storePlayersInMemoryOnly: jasmine.createSpy('storePlayersInMemoryOnly'),
    };

    const mockRouter = {
      navigate: jasmine.createSpy('navigate'),
    };

    await TestBed.configureTestingModule({
      imports: [NextDraftComponent],
      providers: [
        { provide: DraftSelectionService, useValue: mockDraftSelectionService },
        { provide: CurrentPlayersService, useValue: mockCurrentPlayersService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: DraftService, useValue: mockDraftService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NextDraftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should add a clicked available player only once even with multiple template subscribers', () => {
    let selected: Player[] = [];
    let available: Player[] = [];

    const sub1 = component.selectedPlayersData$.subscribe(data => (selected = data.players));
    const sub2 = component.filteredAvailablePlayersData$.subscribe(data => (available = data.players));

    expect(selected.map(p => p.id)).toEqual([1]);
    expect(available.map(p => p.id)).toEqual([2, 3]);

    component.onAvailablePlayerClicked({}, player2);

    expect(selected.map(p => p.id)).toEqual([1, 2]);
    expect(available.map(p => p.id)).toEqual([3]);

    sub1.unsubscribe();
    sub2.unsubscribe();
  });

  it('should remove a clicked drafted player', () => {
    let selected: Player[] = [];
    let available: Player[] = [];

    const sub1 = component.selectedPlayersData$.subscribe(data => (selected = data.players));
    const sub2 = component.filteredAvailablePlayersData$.subscribe(data => (available = data.players));

    component.onDraftedPlayerClicked({}, player1);

    expect(selected.map(p => p.id)).toEqual([]);
    expect(available.map(p => p.id)).toEqual([1, 2, 3]);

    sub1.unsubscribe();
    sub2.unsubscribe();
  });
});
