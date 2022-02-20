export enum RatingSystem {
    German = 1,
    Progressive = 2
};

// German rating system
// end game : 1 goal diff
//  +/- 0.022 for each player   => E.g 2.5 => 2.478
// end game : 5 goal diff
//  +/- 0.02 + 0.01 = +/- 0.03 for each player => E.g 2.5 => 2.47
//
// Progressive rating system
// end game : 1 goal diff
//  0.059 for each player => E.g. 6 => 6.059
// end game : 5 goal diff
//  0.05 + 5*0.011 = 0.05 + 0.055 = 0.105 . E.g.  6 => 6.105
// end game : 8 goal diff
//  0.05 + 8*0.011 = 0.05 + 0.088 = 0.135 . E.g.  6 => 6.135

export class RatingSystemSettings {
    public static GetExpectedLowerEndRating(ratingSys: RatingSystem): number {

        if (ratingSys === RatingSystem.German) {
            return 5;
        } else if (ratingSys === RatingSystem.Progressive) {
            return 4;
        }

        return 0;
    }

    public static GetExpectedUpperEndRating(ratingSys: RatingSystem): number {

        if (ratingSys === RatingSystem.German) {
            return 1;
        } else if (ratingSys === RatingSystem.Progressive) {
            return 10;
        }

        return 0;
    }

    public static GetGoalMultiplierForMatch(ratingSys: RatingSystem): number {
        if (ratingSys === RatingSystem.German) {
            return 0.002;
        } else if (ratingSys === RatingSystem.Progressive) {
            return 0.011;
        }
        return 0.1;
    }

    public static GetFixedMultiplierForMatch(ratingSys: RatingSystem): number {
        if (ratingSys === RatingSystem.German) {
            return 0.02;
        } else if (ratingSys === RatingSystem.Progressive) {
            return 0.05;
        }
        return 0.1;
    }

    public static GetSignMultiplierForWinner(ratingSys: RatingSystem): number {
        if (ratingSys === RatingSystem.German) {
            return -1;
        } else if (ratingSys === RatingSystem.Progressive) {
            return 1;
        }
        return -1;
    }

    public static GetSignMultiplierForLoser(ratingSys: RatingSystem): number {
        if (ratingSys === RatingSystem.German) {
            return 1;
        } else if (ratingSys === RatingSystem.Progressive) {
            return -1;
        }
        return 1;
    }
}