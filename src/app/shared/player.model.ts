/**
 * Defines a player.
 */
export class Player {
    public rating: number;
    public keywords = '';
    public displayName = '';

    constructor(public id: number, public name: string) {
        this.rating = 2.5;
    }

    getDisplayName(): string {
        if (this.displayName && this.displayName !== '') {
            return this.displayName;
        }

        return this.name;
    }

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
