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


export interface GameEventData {
  matchDate: string;
  name: string | undefined;
}

export function createGameEventDataFromRequest(request: CreateGameRequest): GameEventData {
  return {
    matchDate: request.matchDate,
    name: getEventNameForRequest(request)
  };
}

export interface GameNamesList {
  items: string[];
}