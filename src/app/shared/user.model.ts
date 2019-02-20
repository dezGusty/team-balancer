export interface UserRoles {
    standard: boolean;
    organizer?: boolean;
    admin?: boolean;
}

export class User {
    email: string;
    photoURL: string;
    roles: UserRoles;

    constructor(authData: { email: string, photoURL: string }) {
        this.email = authData.email;
        this.photoURL = authData.photoURL;
        this.roles = { standard: true };
    }
}
