import { getMessaging, getToken } from "firebase/messaging";
// import { initializeApp } from "firebase-admin/app";
const admin = require('firebase-admin');
admin.initializeApp();


// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
const messaging = getMessaging();

getToken(messaging, { vapidKey: '<YOUR_PUBLIC_VAPID_KEY_HERE>' }).then((currentToken) => {
    if (currentToken) {
        // Send the token to your server and update the UI if necessary
        // ...
    } else {
        // Show permission request UI
        console.log('No registration token available. Request permission to generate one.');
        // ...
    }
}).catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
    // ...
});

/**
 * Initialize without parameters
 * 
 * https://firebase.google.com/docs/admin/setup#windows
 * The SDK can also be initialized with no parameters. In this case, the SDK uses Google Application Default Credentials. 
 * Because default credentials lookup is fully automated in Google environments, with no need to supply environment variables or other configuration,
 * this way of intializing the SDK is strongly recommeneded for applications running on Compute Engine, Kubernetes Engine, App Engine, and Cloud Functions.
 * 
 * To optionally specify initialization options for services such as Realtime Database, Cloud Storage, or Cloud Functions, use the FIREBASE_CONFIG environment variable.
 * If the content of the FIREBASE_CONFIG variable begins with a { it will be parsed as a JSON object. 
 * Otherwise the SDK assumes that the string is the path of a JSON file containing the options.
 * Note: The FIREBASE_CONFIG environment variable is included automatically in Cloud Functions for Firebase functions that were deployed via the Firebase CLI.
 */

const app = admin.initializeApp();


async function makeSubScription(data: any): Promise<string> {
    await app.getMessaging().subscribeToTopic(data.token, data.topic);
    return 'subscribed to ${data.topic}';
}
export const subscribeToTopic = app.getFunctions().https.onCall(
    (data: any, context: any) => {
        return makeSubScription(data);
    }
);

export const unsubscribeFromTopic = app.getFunctions().https.onCall(
    async (data: any, context: any) => {
        await app.getMessaging().unsubscribeFromTopic(data.token, data.topic);

        return `unsubscribed from ${data.topic}`;
    }
);

export const sendOnFirestoreCreate = app.getFunctions().firestore
    .document('matches/{matchId}')
    .onCreate(async (snapshot: any, context: any) => {
        const matchData = snapshot.data();

        const matchDate = context?.params?.matchId || '';
        const linkToUse = 'https://teams-balancer.firebaseapp.com/recent/' + matchDate;

        const team1Count = matchData?.team1?.length;
        const team2Count = matchData?.team2?.length;
        const optionalMessagePart = '(' + team1Count + ' vs ' + team2Count + ')';
        // const notification: messaging.Notification = {
        const notification = {
            title: 'New Match Created!',
            body: 'Match ID: [' + matchDate + ']' + optionalMessagePart
        };


        // const payload: admin.messaging.Message = {
        const payload = {
            notification,
            webpush: {
                notification: {
                    vibrate: [100, 100, 200, 200, 300],
                    icon: 'assets/ball_128.png',
                    actions: [
                        {
                            action: 'ok',
                            title: 'ok'
                        }
                    ]
                },
                fcmOptions: {
                    link: linkToUse
                }
            },
            topic: 'matches'
        };

        return app.getMessaging().send(payload);
    });

export const sendOnDraftWrite = app.getFunctions().firestore
    .document('drafts/next')
    .onWrite(async (snapshot: any) => {
        const draftDoc = snapshot.after;
        const readPlayerEntries = draftDoc.get('players');
        const readReserveEntries = draftDoc.get('reserves');
        const numPlayers = readPlayerEntries?.length;
        const numReserves = readReserveEntries?.length || 0;
        // const notification: admin.messaging.Notification = {
        const notification = {
            title: 'Draft changes.',
            body: 'There are currently ' + numPlayers + ' players'
                + (numReserves !== 0 ? '(' + numReserves + ' reserves)' : '')
                + '.'
        };

        // const payload: WebpushNotification = {
        const payload = {
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

        return app.getMessaging().send(payload);
    });

// import * as functions from 'firebase/functions';
// import * as admin from 'firebase/compat/admin';

// admin.initializeApp();

// // Note (Augustin Preda, 2020.01.31): This was started from a tutorial on
// // https://angularfirebase.com/lessons/fcm-topic-notifications-angularfire-and-callable-functions/

// // The functions contained here are for the tfl/team-balancer web app

// async function makeSubScription(data: any): Promise<string> {
//     await admin.messaging().subscribeToTopic(data.token, data.topic);
//     return 'subscribed to ${data.topic}';
// }

// export const subscribeToTopic = functions.https.onCall(
//     (data, context) => {
//         return makeSubScription(data);

//     }
// );


// export const unsubscribeFromTopic = functions.https.onCall(
//     async (data, context) => {
//         await admin.messaging().unsubscribeFromTopic(data.token, data.topic);

//         return `unsubscribed from ${data.topic}`;
//     }
// );

// export const sendOnFirestoreCreate = functions.firestore
//     .document('matches/{matchId}')
//     .onCreate(async (snapshot, context) => {
//         const matchData = snapshot.data();

//         const matchDate = context?.params?.matchId || '';
//         const linkToUse = 'https://teams-balancer.firebaseapp.com/recent/' + matchDate;

//         const team1Count = matchData?.team1?.length;
//         const team2Count = matchData?.team2?.length;
//         const optionalMessagePart = '(' + team1Count + ' vs ' + team2Count + ')';
//         const notification: admin.messaging.Notification = {
//             title: 'New Match Created!',
//             body: 'Match ID: [' + matchDate + ']' + optionalMessagePart
//         };

//         const payload: admin.messaging.Message = {
//             notification,
//             webpush: {
//                 notification: {
//                     vibrate: [100, 100, 200, 200, 300],
//                     icon: 'assets/ball_128.png',
//                     actions: [
//                         {
//                             action: 'ok',
//                             title: 'ok'
//                         }
//                     ]
//                 },
//                 fcmOptions: {
//                     link: linkToUse
//                 }
//             },
//             topic: 'matches'
//         };

//         return admin.messaging().send(payload);
//     });

// export const sendOnDraftWrite = functions.firestore
//     .document('drafts/next')
//     .onWrite(async snapshot => {
//         const draftDoc = snapshot.after;
//         const readPlayerEntries = draftDoc.get('players');
//         const readReserveEntries = draftDoc.get('reserves');
//         const numPlayers = readPlayerEntries?.length;
//         const numReserves = readReserveEntries?.length || 0;
//         const notification: admin.messaging.Notification = {
//             title: 'Draft changes.',
//             body: 'There are currently ' + numPlayers + ' players'
//                 + (numReserves !== 0 ? '(' + numReserves + ' reserves)' : '')
//                 + '.'
//         };

//         const payload: admin.messaging.Message = {
//             notification,
//             webpush: {
//                 notification: {
//                     vibrate: [100, 100, 200],
//                     icon: 'assets/ball_128.png',
//                     actions: [
//                         {
//                             action: 'ok',
//                             title: 'ok'
//                         }
//                     ]
//                 },
//                 fcmOptions: {
//                     link: 'https://teams-balancer.firebaseapp.com/draft'
//                 }
//             },
//             topic: 'drafts'
//         };

//         return admin.messaging().send(payload);
//     });
