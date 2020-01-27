/**
 * Defines a player.
 */
export class Player {
    public rating: number;
    public keywords = '';
    public displayName = '';
    public affinity = 0;

    constructor(public id: number, public name: string) {
        this.rating = 2.5;
        this.affinity = 0;
    }
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
    });
}
