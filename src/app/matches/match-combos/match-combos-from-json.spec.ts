import { Player } from 'src/app/shared/player.model';
import { PlayersExport } from 'src/app/nextdraft/export-players';
import { MatchCombosComponent } from './match-combos.component';
import playersInput from './players-input-12.json';

describe('MatchCombosComponent – team balancing from JSON input', () => {
  let component: MatchCombosComponent;
  let players: Player[];

  beforeEach(() => {
    const data = playersInput as PlayersExport;
    players = data.players.map(p => {
      const player = new Player(p.id, p.name);
      player.rating = p.rating;
      player.displayName = p.displayName;
      player.keywords = p.keywords;
      player.affinity = p.affinity;
      player.stars = p.stars;
      player.reserve = p.reserve;
      return player;
    });

    component = new MatchCombosComponent();
    component.playerList = players;
  });

  it('should load the JSON file successfully with players', () => {
    expect(players).toBeTruthy();
    expect(players.length).toBeGreaterThan(0);
  });

  it('should create 2 non-empty teams of equal size', () => {
    component.prepareTeams();

    expect(component.displayedMatchDetails.length).toBeGreaterThan(0);

    const firstOption = component.displayedMatchDetails[0];
    expect(firstOption.team1.length).toBeGreaterThan(0);
    expect(firstOption.team2.length).toBeGreaterThan(0);
    expect(firstOption.team1.length).toBe(firstOption.team2.length);
  });
});
