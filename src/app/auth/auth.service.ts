import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class AuthService {
    constructor(public router: Router, public afAuth: AngularFireAuth) {
        this.getToken();
    }
    private token: string;

    signupUser() {
        //
    }

    doGoogleLogin() {
        return new Promise<any>((resolve, reject) => {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            this.afAuth.auth
                .signInWithPopup(provider)
                .then(res => {
                    this.router.navigate(['/']);
                    this.getToken();
                    resolve(res);
                });
        });
    }

    signOut() {
        this.afAuth.auth.signOut().then(
            () => {
                this.router.navigate(['']);
            }
        );
    }

    getToken() {
        if (!this.afAuth.auth || !this.afAuth.auth.currentUser) {
            return;
        }
        this.afAuth.auth.currentUser.getIdToken()
            .then(
                (token: string) => {
                    this.token = token;
                    console.log('[token]', this.token);
                }
            );
        return this.token;
    }

    isAuthenticated() {
        const result = (this.token != null);
        // console.log('[auth]', result);
        return result;
    }

}
