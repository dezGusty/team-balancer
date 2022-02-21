# Release checklist

This is a quick list of steps to be performed when performing a new release.

- [ ] increment version number (see src/app/about/about.component.ts)
- [ ] update changes / readme file
- [ ] ensure the file `firebase-messaging-sw.js` exists and is up to date (in the same directory as `firebase-messaging-source.js`)
- [ ] build the project
  - `ng build --configuration production`
- [ ] deploy to firebase
  - `firebase deploy`
