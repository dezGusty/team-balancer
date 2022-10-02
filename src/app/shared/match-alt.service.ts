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

    const ref = doc(this.firestore, 'matches/' + matchName);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      console.log('Data ', docSnap.data());
      myResult = docSnap.data() as CustomPrevGame;
      console.log('Data ', myResult);
      // const game: CustomPrevGame = docSnap.data();
      // console.log(game);
    }
    else {
      console.log('Could not find document for ', matchName);
    }

    // const snapshot = await this.db.doc<CustomPrevGame>('matches/' + matchName).get();
    // console.log('item get', snapshot);




    // for(const doc of snapshot.docs){
    //     console.log(doc.id, '=>', doc.data());
    //   }

    // await snapshot.forEach(matchDoc =>
    //   // Map each document (expected: only 1) to the read operation.
    //   map(matchDoc => {
    //     console.log('mapping', matchDoc);
    //     // Read the document data.
    //     // It is expected to consist of serialized data.
    //     // const fbData = matchDoc.data();
    //     // const obj: CustomPrevGame = {
    //     //     team1: fbData.team1,
    //     //     team2: fbData.team2,
    //     //     scoreTeam1: fbData.scoreTeam1,
    //     //     scoreTeam2: fbData.scoreTeam2,
    //     //     appliedResults: fbData.appliedResults,
    //     //     savedResult: fbData.savedResult,
    //     //     postResults: fbData.postResults
    //     // };
    //     // myResult = obj;
    //     // return myResult;
    //   })
    // );

    /**let players: Player[];

    const dbRef = ref(getDatabase());
    get(child(dbRef, 'ratings/' + documentName)).then((snapshot) => {
        if (snapshot.exists()) {
            console.log(snapshot.val());
            players = snapshot.val();
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
    return players; */
    return myResult;
  }
}
