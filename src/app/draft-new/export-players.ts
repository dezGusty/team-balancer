import { Player } from '../shared/player.model';

export interface ExportedPlayer {
  id: number;
  name: string;
  rating: number;
  displayName: string;
  keywords: string;
  affinity: number;
  stars: number;
  reserve: boolean;
}

export interface PlayersExport {
  exportDate: string;
  players: ExportedPlayer[];
}

export function playersToExportFormat(players: Player[]): PlayersExport {
  return {
    exportDate: new Date().toISOString(),
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      rating: p.rating,
      displayName: p.displayName,
      keywords: p.keywords,
      affinity: p.affinity,
      stars: p.stars,
      reserve: p.reserve,
    })),
  };
}

export function exportPlayersToJsonFile(players: Player[]): void {
  const data = playersToExportFormat(players);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `players-export-${players.length}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
