# Github Copilot instructions for the project Team Balancer

## Project structure

The project is structured as follows:
Angular is used as the main development framework. The source code is located in the `src/` directory. The main application code is located in the `app/` directory, which is further divided into components, services, and models. 
The `environments/` directory contains the environment configuration files for development and production. 
The `assets/` directory contains static assets such as images. The `index.html` file is the main entry point for the application, and the `main.ts` file is the main TypeScript file that bootstraps the Angular application.

## DB Access

The data is stored in Firebase, and the application interacts with Firebase using the AngularFire library. The Firebase configuration is stored in the `firebase-data.ts` file, which is excluded from version control and imported into the environment configuration files.

There are Firebase Firestore rules in place to ensure that only users with the right permissions can access the required data.
These may be out of date, please consult the online project settings.
The permissions should be as follows:
- /users/ collection
  - Read: authenticated users
  - Write, Update, Delete: authenticated Admin users
- /settings/app document
  - Read: authenticated users
  - Write, Update, Delete: authenticated Admin users
- /drafts/ collection
  - Read: authenticated users
  - Write, Update, Delete: authenticated Organizer users
- /games/ collection
  - Read: authenticated users
  - Write, Update, Delete: authenticated Organizer users
- /matches/ collection
  - Read: authenticated users
  - Write, Update, Delete: authenticated Organizer users
- /ratings/ collection
  - Read: authenticated users
  - Write, Update, Delete: authenticated Organizer users

The Angular application may try to cache the permissions locally, but highjacking the permissions would still not allow writing to the database without the correct permissions.
Still, such a scenario would allow the user access to the routes which should be protected.

## Design

The application is meant to be used mobile-first, so any UI components should be designed with mobile devices in mind, while still being responsive and functional on larger screens.

The app uses plain CSS for styling. Most of the styles are defined in the `styles.css` file, but component-specific styles can be defined in the respective component's CSS file.