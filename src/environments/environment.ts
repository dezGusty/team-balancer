// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { firebaseConfig } from './firebase-data';

// localhost or 'your.domain.com'
// it is mandatory to set a domain, for cookies to work properly (see https://goo.gl/S2Hy2A)
const deploymentDomain = 'localhost';

export const environment = {
  production: false,
  firebase: firebaseConfig,
  cookieConsentDomain: deploymentDomain
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
