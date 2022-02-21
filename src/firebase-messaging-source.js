// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
// importScripts('https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js');
// importScripts('https://www.gstatic.com/firebasejs/9.6.7/firebase-messaging.js');

import { } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js'
import { } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-messaging.js'

// Note: copy this file and rename it to 'firebase-messaging-sw.js'

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'apiKey': '<YOUR-API-KEY>',
  'authDomain': '<YOUR-AUTH-DOMAIN>',
  'databaseURL': '<YOUR-DB-URL>',
  'projectId': '<YOUR-PROJ-ID>',
  'storageBucket': '<YOUR-BUCKET>',
  'messagingSenderId': '<YOUR-MESSAGE-ID>',
  'appId': '<YOUR-APP-ID>'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
