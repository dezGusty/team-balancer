import { firebaseConfig } from './firebase-data';

// localhost or 'your.domain.com'
// it is mandatory to set a domain, for cookies to work properly (see https://goo.gl/S2Hy2A)
const deploymentDomain = 'teams-balancer.firebaseapp.com';

export const environment = {
  production: true,
  firebase: firebaseConfig,
  cookieConsentDomain: deploymentDomain
};
