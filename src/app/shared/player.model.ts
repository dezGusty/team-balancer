export class Player {
    public rating: number;

    constructor(public id: number, public name: string) {
        this.rating = 2.5;
    }

}

export function filterPlayerArray(items: Player[], searchedValue: string): Player[] {
    if (!items) {
        return [];
    }
    if (!searchedValue) {
        return items;
    }
    searchedValue = searchedValue.toLocaleLowerCase();

    return items.filter(it => {
        return it.name.toLocaleLowerCase().includes(searchedValue);
    });
}