export interface CreateGameRequest {
  matchDate: string;
  suffix: string;
}

export function getEventNameForDateAndSuffix(date: string, suffix: string): string {
  if (!date) {
    return "";
  }
  if (!suffix || suffix.length === 0) {
    return date;
  }
  return `${date}_${suffix}`;
}

export function getEventNameForRequest(request: CreateGameRequest): string {
  return getEventNameForDateAndSuffix(request.matchDate, request.suffix);
}


export interface GameEventDBData {
  matchDate: string;
  name: string;
  registeredPlayerIds: number[];
}

export interface PlayerWithId {
  id: number;
  name: string;
}

export interface GameEventData {
  matchDate: string;
  name: string;
  registeredPlayers: PlayerWithId[];
}

export function createGameEventDataFromRequest(request: CreateGameRequest): GameEventDBData {
  return {
    matchDate: request.matchDate,
    name: getEventNameForRequest(request),
    registeredPlayerIds: [],
  };
}

// Function to create default GameEventData object
export function createDefaultGameEventDBData(): GameEventDBData {
  return {
    matchDate: "",
    name: "",
    registeredPlayerIds: [],
  };
}
export function createDefaultGameEventData(): GameEventData {
  return {
    matchDate: "",
    name: "",
    registeredPlayers: [],
  };
}

// allow calling GameEventData.DEFAULT
export namespace GameEventDBData {
  export const DEFAULT = createDefaultGameEventDBData();
}

export namespace GameEventData {
  export const DEFAULT = createDefaultGameEventData();
}

export interface GameNamesList {
  items: string[];
}