import { Player, getDisplayName } from './player.model';

export class CustomGame {

    constructor(public team1: Array<Player>, public team2: Array<Player>) {

    }

    /**
     * Transforms the game to a simple text representation.
     * This is expected to be typically used to copy match details in plain text format
     * to the clipboard and paste it in chat applications.
     */
    public toPlainTextFormat(): string {
        let result = '';
        result += '== Team 1 ==\n';
        this.team1.forEach((player, index) => {
            result += ' ' + (index + 1) + '. ' + getDisplayName(player) + '\n';
        });
        result += '\n';
        result += '== Team 2 ==\n';
        this.team2.forEach((player, index) => {
            result += ' ' + (index + 1) + '. ' + getDisplayName(player) + '\n';
        });
        return result;
    }
}

