import { RoleStatus } from "../../enum/RoleStatus.enum.ts";

export class Role {

    constructor(
        public readonly id: number,
        public name: string,
        public description: string,
        public status: RoleStatus
    ) {

    }
}