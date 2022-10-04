import { Injectable } from '@angular/core';
@Injectable()
export class AppStorage {

    public cacheUserData = false;
    constructor() { }

    public getAppStorageItem(key: string): string {
        if (localStorage) {
            return localStorage.getItem(key);
        }

        // else
        return sessionStorage.getItem(key);
    }

    public setAppStorageItem(key: string, value: string): void {
        if (localStorage) {
            localStorage.setItem(key, value);
            return;
        }

        // else
        sessionStorage.setItem(key, value);
    }

    public removeAppStorageItem(key: string): void {
        if (localStorage) {
            localStorage.removeItem(key);
            return;
        }

        // else
        sessionStorage.removeItem(key);
    }
}

