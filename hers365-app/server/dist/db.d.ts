import Database from 'better-sqlite3';
import * as schema from './schema';
import 'dotenv/config';
declare const sqlite: Database;
export declare const db: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {
    $client: Database.Database;
};
export declare const dbAsync: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {
    $client: Database.Database;
};
export { sqlite as dbConnection };
