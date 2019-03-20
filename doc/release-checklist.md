# Release checklist

This is a quick list of steps to be performed when performing a new release.

- [ ] increment version number (see src/app/about/about.component.ts)
- [ ] update changes / readme file
- [ ] build the project
  - `ng build --prod`
- [ ] deploy to firebase
  - `firebase deploy`
