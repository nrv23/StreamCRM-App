import { QueryResultRow } from "pg";


export interface INow extends QueryResultRow {
    now: Date
}