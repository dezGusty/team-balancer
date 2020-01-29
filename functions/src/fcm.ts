import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

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
    .document('discounts/{discountId}')
    .onCreate(async snapshot => {
        const discount = snapshot.data();

        const notification: admin.messaging.Notification = {
            title: 'New Discount Available!',
            body: discount?.headline
        };

        const payload: admin.messaging.Message = {
            notification,
            webpush: {
                notification: {
                    vibrate: [200, 100, 200],
                    icon: 'assets/ball_128.png',
                    actions: [
                        {
                            action: 'ok',
                            title: 'fine'
                        }
                    ]
                }
            },
            topic: 'discounts'
        };

        return admin.messaging().send(payload);
    });

export const sendOnDraftWrite = functions.firestore
    .document('drafts/next')
    .onWrite(async snapshot => {
        const draftDoc = snapshot.after;
        const readPlayerEntries = draftDoc.get('players');
        const numPlayers = readPlayerEntries?.length;
        const notification: admin.messaging.Notification = {
            title: 'Draft changes.',
            body: 'There are currently ' + numPlayers + ' players.'
        };

        const payload: admin.messaging.Message = {
            notification,
            webpush: {
                notification: {
                    vibrate: [200, 100, 200],
                    icon: 'assets/ball_128.png',
                    actions: [
                        {
                            action: 'ok',
                            title: 'fine'
                        }
                    ]
                }
            },
            topic: 'drafts'
        };

        return admin.messaging().send(payload);
    });
