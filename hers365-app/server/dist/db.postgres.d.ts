import { Pool } from 'pg';
declare const pool: Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<any> & {
    $client: Pool;
};
export { pool };
