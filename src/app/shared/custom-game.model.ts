import { Player, getDisplayName } from './player.model';

export class CustomGame {

    constructor(public team1: Array<Player>, public team2: Array<Player>) {

    }

    

    /**
     * Transforms the game to a simple text representation.
     * This is expected to be typically used to copy match details in plain text format
     * to the clipboard and paste it in chat applications.
     */
    public toPlainTextFormat(randomize: boolean = false): string {
        const shuffle = <T>(arr: T[]): T[] => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };

        // clone / make a deep copy of the teams to avoid mutating the original arrays when shuffling
        let team1Names = this.team1.map(player => getDisplayName(player) );
        let team2Names = this.team2.map(player => getDisplayName(player) );
        team1Names = randomize? shuffle(team1Names) : team1Names;
        team2Names = randomize? shuffle(team2Names) : team2Names;

        let result = '';
        result += '== Team 1 ==\n';
        team1Names.forEach((player, index) => {
            result += ' ' + (index + 1) + '. ' + player + '\n';
        });
        result += '\n';
        result += '== Team 2 ==\n';
        team2Names.forEach((player, index) => {
            result += ' ' + (index + 1) + '. ' + player + '\n';
        });
        return result;
    }
}

