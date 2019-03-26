import { DeviceDetectorService } from 'ngx-device-detector';
import { Injectable } from '@angular/core';
@Injectable()
export class AppStorage {
    constructor(private deviceService: DeviceDetectorService) { }

    public getAppStorageItem(key: string): string {
        // disable for firefox for now?
        if ('Firefox' === this.deviceService.browser) {
            // return null;
        }

        if (localStorage) {
            return localStorage.getItem(key);
        }

        // else
        return sessionStorage.getItem(key);
    }

    public setAppStorageItem(key: string, value: string): void {
        // disable for firefox for now?
        if ('Firefox' === this.deviceService.browser) {
            // return;
        }

        if (localStorage) {
            localStorage.setItem(key, value);
            return;
        }

        // else
        sessionStorage.setItem(key, value);
    }
}

