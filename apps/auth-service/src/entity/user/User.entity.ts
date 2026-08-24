import { UserStatus } from "../../enum/UserStatus.enum.ts";



export class User {

    constructor(
        public readonly id: number,
        public external_id: string,
        public email: string,
        public password_hash: string,
        public first_name: string,
        public last_name: string,
        public status: UserStatus, // cambiar a un status enum
        public created_at: JSON,
        public updated_at: JSON

    ) {

    }
}