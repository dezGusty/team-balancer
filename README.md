# TeamBalancer

This project aims to create an easy to use application to create balanced teams for football matches. To achieve this, a simple rating system is used, with the ratings of the participants being modified according to their results.

It should be applicable to other scenarios where the individuals taking part in the draft can be rated via a simple/numerical method.

## Used tools

This project uses Angular as the main development framework.
Firebase is used to store and access the data.
!OBSOLETE!
The [Cookie Consent](https://www.osano.com/cookieconsent) library is used via [ngx-cookieconsent](https://www.npmjs.com/package/ngx-cookieconsent).

## Development

### Quick set-up

* Install Node.js v16 (incl. npm)
* Install Angular CLI, via the command line
  * `npm install -g @angular/cli`
* Install git
* Clone the repository (E.g. C:/dev/team-balancer)
* Open a terminal in the cloned directory and install the dependencies by running
  * `npm i`
* Configure your firebase credentials
  * create a new typescript file -> `src/environments/firebase-data.ts`
  * go to <https://console.firebase.google.com/>
  * select your project, go to `Project settings`, `SDK setup and configuration` section, `Config`
  * Copy the json content into the firebase-data.ts file.
  * Replace "const firebaseConfig" with "export const firebaseConfig"

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Deployment

Check out the steps to [Configure firebase](./doc/configure-firebase.md)

For updating / releasing a new version, look at the [Release checklist](./doc/release-checklist.md)

The Cookie Consent functionality will not work properly if you don't configure it correctly.
To configure it, look at the files in the environments directory (`environments.ts` and `environments.prod.ts`) and update the deployment domain.

```ts
const deploymentDomain = "localhost";
```

## TODO

Some of the features to work on

* redesign cards used in draft selection to be more responsive
  * on larger displays, it should use more real estate
* redesign player edit card to not be fixed on the right side
  * could be included in the card once selected
  * could be a sliding pane for small displays
* redesign custom game component - does not need player selection, can always start from draft
  * can add more intuitive player team assignments (E.g. slide left/right)
* Button loading component
