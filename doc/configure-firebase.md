# Setting up hosting for firebase

## Prerequisites

firebase installed

```cmd
npm install -g firebase-tools
```

A firebase project ([Create Project](https://console.firebase.google.com))

## Build

Build your application release

```cmd
ng build --prod
```

## Prepare Deploy

Open a command shell in your project directory.

Logout if needed

```cmd
firebase logout
```

Login with Google account

```cmd
firebase login
```

To readd the project

```cmd
firebase use --add
```

Configure aliases inside `.firebaserc` according to your firebase project name.

Add the firebase configuration credentials:

- create a typescript file name `firebase-data.ts` inside `src\environments` folder
- paste the config details from `https://console.firebase.google.com/project/<project-name>/settings/general/`
- add the export keyword in front of it

E.g

```ts
export const firebaseConfig = {
  apiKey: 'some data',
  //...
}
```

Run `firebase use default`.

Init the project

```cmd
firebase init
```

Select hosting

Choose a default firebase project
E.g.
dist/team-balancer

Use single-page application rerouting to index.html

Don't worry if you make mistakes, you can call `init` again.
Sample output:

```cmd
c:\code\team-balancer>firebase init

     ######## #### ########  ######## ########     ###     ######  ########
     ##        ##  ##     ## ##       ##     ##  ##   ##  ##       ##
     ######    ##  ########  ######   ########  #########  ######  ######
     ##        ##  ##    ##  ##       ##     ## ##     ##       ## ##
     ##       #### ##     ## ######## ########  ##     ##  ######  ########

You're about to initialize a Firebase project in this directory:

  c:\code\team-balancer

Before we get started, keep in mind:

  * You are currently outside your home directory
  * You are initializing in an existing Firebase project directory

? Are you ready to proceed? Yes
? Which Firebase CLI features do you want to setup for this folder? Press Space to select features, then Enter to confi
rm your choices. Hosting: Configure and deploy Firebase Hosting sites

=== Project Setup

First, let's associate this project directory with a Firebase project.
You can create multiple project aliases by running firebase use --add,
but for now we'll just set up a default project.

i  .firebaserc already has a default project, skipping

=== Hosting Setup

Your public directory is the folder (relative to your project directory) that
will contain Hosting assets to be uploaded with firebase deploy. If you
have a build process for your assets, use your build's output directory.

? What do you want to use as your public directory? dist/team-balancer
? Configure as a single-page app (rewrite all urls to /index.html)? Yes
? File dist/team-balancer/index.html already exists. Overwrite? No
i  Skipping write of dist/team-balancer/index.html

i  Writing configuration info to firebase.json...
i  Writing project information to .firebaserc...

+  Firebase initialization complete!
```

## Test it locally

```cmd
firebase serve --only hosting
```

## Deploy

```cmd
firebase deploy
```

Effect

```cmd
=== Deploying to 'teams-balancer'...

i  deploying hosting
i  hosting[teams-balancer]: beginning deploy...
i  hosting[teams-balancer]: found 10 files in dist/team-balancer
+  hosting[teams-balancer]: file upload complete
i  hosting[teams-balancer]: finalizing version...
+  hosting[teams-balancer]: version finalized
i  hosting[teams-balancer]: releasing new version...
+  hosting[teams-balancer]: release complete

+  Deploy complete!

Project Console: https://console.firebase.google.com/project/teams-balancer/overview
Hosting URL: https://teams-balancer.firebaseapp.com
```

Access it.

## Quick update

```cmd
ng build --prod
firebase deploy
```
