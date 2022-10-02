import { Injectable } from '@angular/core';
import { CustomPrevGame } from './custom-prev-game.model';
import { doc, getDoc, docData, Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class MatchAltService {

  constructor(private firestore: Firestore) { }

  /**
     * Asynchronously retrieves the match object as an Observable.
     * @param matchName The name of the match (basically: the date to be used as a key for accessing the match from the DB)
     * E.g. '2018-03-23'
     */
  public async getMatchForDateAsync(matchName: string): Promise<CustomPrevGame> {
    // Get the firestore document where the match details are stored, based on the key.
    // E.g. stored in [matches/2018-03-23]
    let myResult: CustomPrevGame = null;
    console.log('getMatchForDateAsync');
    const docName = 'matches/' + matchName;

    const ref = doc(this.firestore, docName);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      myResult = docSnap.data() as CustomPrevGame;
    }
    else {
      console.log('Could not find document for ', docName);
    }

    return myResult;
  }

  /**
   * Get the match date (E.g. "2022-09-02") from a rating date (E.g. "2022-09-02_LblABC123")
   * @param ratingDate 
   */
  public getMatchDateFromRatingDateWithLabel(ratingDate: string): string {
    if (ratingDate.length > 10) {
      return ratingDate.substring(0, 10);
    }
    return ratingDate;
  }

  
}
