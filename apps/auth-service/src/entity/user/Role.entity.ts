import { RoleStatus } from "../../enum/RoleStatus.enum.ts";

export class Role {

    constructor(
        public readonly id: number,
        public name: string,
        public description: string,
        public created_at: string,
        public status: RoleStatus,
        public is_system: boolean
    ) {

    }
}