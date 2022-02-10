import { Injectable } from "@angular/core";
import { Player } from "./player.model";

@Injectable()
export class RatingScaler {

    // constructor.
    constructor(){

    }

    public static rescalePlayerRatings(players: Player[], newLowerBound: number, newUpperBound: number, invertRatings: boolean): Player[] {
        // (deep) clone the array
        const playersCpy = players.map(x => ({ ...x }));

        // find the minimum rating
        const minRating = Math.min(...playersCpy.map(x => x.rating));
        console.log("min rating: ", minRating);
        
        // find the maximum rating
        const maxRating = Math.max(...playersCpy.map(x => x.rating));
        console.log("max rating: ", maxRating);

        //      minRating    guyRating               maxRating
        // 
        // newMinRating             newGuyRating                                            newMaxRating

        const oldRange = maxRating - minRating;
        const newRange = newUpperBound - newLowerBound;
        const scalingMultiplier = newRange / oldRange;

        // Validations
        if (oldRange == 0) return playersCpy;
        if (newRange <= 0) return playersCpy;

        // for each member, rescale from the old min-max to the new min-max
        playersCpy.map(guy =>
            guy.rating = invertRatings 
                    ? newUpperBound - (guy.rating - minRating) * scalingMultiplier
                    : newLowerBound + (guy.rating - minRating) * scalingMultiplier
        );

        return playersCpy;
    }
}