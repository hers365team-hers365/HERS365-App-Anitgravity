import { Pool } from 'pg';
declare const pool: Pool;
import * as schema from './schema';
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
export { pool };
