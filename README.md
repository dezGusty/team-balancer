# TeamBalancer

This project aims to create an easy to use application to create balanced teams for football matches. To achieve this, a simple rating system is used, with the ratings of the participants being modified according to their results.

It should be applicable to other scenarios where the individuals taking part in the draft can be rated via a simple/numerical method.

## Used tools

This project uses Angular as the main development framework.
Firebase is used to store and access the data.
The [Cookie Consent](https://www.osano.com/cookieconsent) library is used via [ngx-cookieconsent](https://www.npmjs.com/package/ngx-cookieconsent).

## Development

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
