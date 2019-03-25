export function getAppStorageItem(key: string): string {
    if (localStorage) {
        return localStorage.getItem(key);
    }

    // else
    return sessionStorage.getItem(key);
}

export function setAppStorageItem(key: string, value: string): void {
    if (localStorage) {
        localStorage.setItem(key, value);
    }

    // else
    return sessionStorage.setItem(key, value);
}
