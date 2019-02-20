import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, take } from 'rxjs/operators';
import { AngularFirestore } from 'angularfire2/firestore';
import { User } from '../shared/user.model';

@Injectable()
export class AuthService {
    constructor(public router: Router,
        private db: AngularFirestore,
        public afAuth: AngularFireAuth) {
        this.getToken();

        this.afAuth.authState.pipe(
            switchMap(auth => {
                if (auth) {
                    return this.db.doc('users/' + auth.uid).get();
                } else {
                    return null;
                }
            })
        );
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
                    this.updateUser(res.user);
                    resolve(res);
                });
        });
    }

    signOut() {
        // unsubscribe
        this.afAuth.auth
            .signOut()
            .then(() => {
                this.token = null;
                this.router.navigate(['']);
            });
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

    updateUser(authdata: firebase.User) {
        const userData = new User(authdata);
        console.log('[upd user]', userData, authdata.uid);
        const ref = this.db.doc('users/' + authdata.uid).get();
        ref.pipe(take(1)).subscribe(
            user => {
                console.log('zyx', user);
                if (!user.get('roles')) {
                    const obj = { ...userData };
                    console.log('User does not have role. Should create');
                    this.db.doc('users/' + authdata.uid).update(obj);
                }
            }
        );
    }
}


