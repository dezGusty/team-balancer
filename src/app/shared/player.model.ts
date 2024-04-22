
/**
 * Defines a player.
 */
export class Player {
    public rating: number;
    public keywords = '';
    public displayName = '';
    public affinity = 0;
    public mostRecentMatches: Array<{ date: string, diff: number }> = new Array<{ date: string, diff: number }>();
    public isArchived = false;
    public stars: number = 0;

    constructor(public id: number, public name: string) {
        this.rating = 6;
        this.affinity = 0;
        this.stars = 0;
    }
}

export namespace Player {
    export const EMPTY = new Player(0, '');
}

export function filterPlayersArrayByContent(players: Player[], filterByContent: string): Player[] {
    const filterTokens = filterByContent.split(' ');
    // return a filtered list of players that match all the provided filterTokens.
    // E.g. if the filterByContent is "John Doe", it will return all players that have "John" AND "Doe" in their name.
    // Johnatan Doe, Johnny Doe, John Doederlein, etc.
    return players.filter(player => {
        return filterTokens.every(token => {
            return player.name.toLowerCase().includes(token.toLowerCase())
                || player.displayName.toLowerCase().includes(token.toLowerCase())
                || player.keywords.split(' ').some(keyword => keyword.toLowerCase().includes(token.toLowerCase()));
        });
    });
}

/**
 * @description Retrieves the display name for a player in a standard or
 * nice format.
 * @param player The player object to use.
 * @returns The display name.
 */
export function getDisplayName(player: Player): string {
    if (player.displayName && player.displayName !== '') {
        return player.displayName;
    }

    return player.name;
}

/**
 * @description Filters an array of Player objects.
 * @param items Array of items (players) to search in.
 * @param searchedValue The value to search for.
 * @returns A subset of the collection, for which the items match the condition.
 * A new array is created, distinct from the original source.
 */
export function filterPlayerArray(items: Player[], searchedValue: string): Player[] {
    // validation.
    if (!items) {
        return [];
    }

    // empty string/null scenario
    if (!searchedValue || searchedValue === '') {
        return Object.assign([], items);
    }

    searchedValue = searchedValue.toLocaleLowerCase();

    return items.filter(it => {
        // search for the value in the display name. (nullable)
        if (it.displayName && it.displayName.toLocaleLowerCase().includes(searchedValue)) {
            return true;
        }
        // search for the value in the name
        if (it.name.toLocaleLowerCase().includes(searchedValue)) {
            return true;
        }
        // search for the value in the keywords. (nullable)
        if (it.keywords && it.keywords.toLocaleLowerCase().includes(searchedValue)) {
            return true;
        }

        return false;
    });
}
