export interface CreateGameEventRequest {
  matchDate: string;
  suffix: string;
}

export function getEventNameForDateAndSuffix(date: string, suffix: string): string | undefined {
  if (!date) {
    return undefined;
  }
  if (!suffix || suffix.length === 0) {
    return date;
  }
  return `${date}_${suffix}`;
}

export function getEventNameForRequest(request: CreateGameEventRequest): string | undefined {
  return getEventNameForDateAndSuffix(request.matchDate, request.suffix);
}


export interface GameEventData {
  matchDate: string;
  name: string | undefined;
}

export function createGameEventDataFromRequest(request: CreateGameEventRequest): GameEventData {
  return {
    matchDate: request.matchDate,
    name: getEventNameForRequest(request)
  };
}

export interface GameNamesList {
  items: string[];
}