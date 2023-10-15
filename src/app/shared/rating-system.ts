
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
    public static GetExpectedLowerEndRating(): number {
        return 4;
    }

    public static GetExpectedUpperEndRating(): number {
        return 10;
    }

    public static GetGoalMultiplierForMatch(): number {
        return 0.011;
    }

    public static GetFixedMultiplierForMatch(): number {
        return 0.05;
    }

    public static GetSignMultiplierForWinner(): number {
        return 1;
    }

    public static GetSignMultiplierForLoser(): number {
        return -1;
    }
}