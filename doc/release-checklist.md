# Release checklist

This is a quick list of steps to be performed when performing a new release.

- [ ] increment version number (see src/app/about/about.component.ts)
- [ ] update changes / readme file
- [ ] ensure the file `firebase-messaging-sw.js` exists and is up to date (in the same directory as `firebase-messaging-source.js`)
- [ ] build the project
  - `ng build --configuration production`
  <!-- - `ng build --configuration production --browser .` for Angular 18. -->
- [ ] deploy to firebase
  - `firebase deploy`
    OR
  - `firebase deploy --only hosting`

Note: firebase functions are currently disabled. (removed functions section from firebase.json)

```json
{
  "hosting": {
    "public": "dist/team-balancer",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint",
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ],
    "source": "functions"
  }
}
```
