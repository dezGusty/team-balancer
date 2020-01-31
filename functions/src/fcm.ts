import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Note (Augustin Preda, 2020.01.31): This was started from a tutorial on
// https://angularfirebase.com/lessons/fcm-topic-notifications-angularfire-and-callable-functions/

// The functions contained here are for the tfl/team-balancer web app

async function makeSubScription(data: any): Promise<string> {
    await admin.messaging().subscribeToTopic(data.token, data.topic);
    return 'subscribed to ${data.topic}';
}

export const subscribeToTopic = functions.https.onCall(
    (data, context) => {
        return makeSubScription(data);

    }
);


export const unsubscribeFromTopic = functions.https.onCall(
    async (data, context) => {
        await admin.messaging().unsubscribeFromTopic(data.token, data.topic);

        return `unsubscribed from ${data.topic}`;
    }
);

export const sendOnFirestoreCreate = functions.firestore
    .document('matches/{matchId}')
    .onCreate(async snapshot => {
        const matchData = snapshot.data();

        const team1Count = matchData?.team1?.length;
        const team2Count = matchData?.team2?.length;
        const optionalMessagePart = '(' + team1Count + ' vs ' + team2Count + ')';
        const notification: admin.messaging.Notification = {
            title: 'New Match Created!',
            body: 'Match ID: [' + matchData?.headline + ']' + optionalMessagePart
        };

        const payload: admin.messaging.Message = {
            notification,
            webpush: {
                notification: {
                    vibrate: [200, 200, 200],
                    icon: 'assets/ball_128.png',
                    actions: [
                        {
                            action: 'ok',
                            title: 'ok'
                        }
                    ]
                },
                fcmOptions: {
                    link: 'https://teams-balancer.firebaseapp.com/recent'
                }
            },
            topic: 'matches'
        };

        return admin.messaging().send(payload);
    });

export const sendOnDraftWrite = functions.firestore
    .document('drafts/next')
    .onWrite(async snapshot => {
        const draftDoc = snapshot.after;
        const readPlayerEntries = draftDoc.get('players');
        const readReserveEntries = draftDoc.get('reserves');
        const numPlayers = readPlayerEntries?.length;
        const numReserves = readReserveEntries?.length || 0;
        const notification: admin.messaging.Notification = {
            title: 'Draft changes.',
            body: 'There are currently ' + numPlayers + ' players'
                + (numReserves !== 0 ? '(' + numReserves + ' reserves)' : '')
                + '.'
        };

        const payload: admin.messaging.Message = {
            notification,
            webpush: {
                notification: {
                    vibrate: [100, 100, 200],
                    icon: 'assets/ball_128.png',
                    actions: [
                        {
                            action: 'ok',
                            title: 'ok'
                        }
                    ]
                },
                fcmOptions: {
                    link: 'https://teams-balancer.firebaseapp.com/draft'
                }
            },
            topic: 'drafts'
        };

        return admin.messaging().send(payload);
    });
