import 'server-only';

import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';

const instances: Map<string, DuckDBInstance> = new Map();
const connections: Map<string, DuckDBConnection> = new Map();

export type DescribeSqlResult = {
    column_name: string;
    column_type: string;
    null: string;
};

export async function describeSql(dbName: string, sql: string): Promise<DescribeSqlResult[]> {
    const db = await getClient(dbName);
    const describeResult = await query<DescribeSqlResult>(db, `DESCRIBE ${sql}`);

    return describeResult;
}

export async function executeSql<T>(dbName: string, sql: string): Promise<T[]> {
    const db = await getClient(dbName);
    const result = await query<T>(db, sql);

    return result;
}

async function query<T>(client: DuckDBConnection, sql: string, bound?: Record<string, any>): Promise<T[]> {
    const reader = await client.runAndReadAll(sql, bound);
    const rows = reader.getRowObjects();

    return rows as T[];
}

async function getClient(dbName: string) {
    const path = getPath(dbName);

    if (!connections.has(path)) {
        if (!instances.has(path)) {
            const instance = await DuckDBInstance.create(path);
            instances.set(path, instance);
        }

        const instance = instances.get(path)!;
        const conn = await instance.connect();
        connections.set(path, conn);
    }

    const connection = connections.get(path)!;
    return connection;
}

function getPath(dbName: string) {
    let duckDbEnv = process.env.DUCKDB_ENV;

    if (!duckDbEnv) {
        console.error('*** DUCKDB_ENV is not set. Assuming "local"');
        duckDbEnv = 'local';
    }

    if (duckDbEnv === 'local') {
        return `./dbs/${dbName}.duckdb`;
    } else if (duckDbEnv === 'production') {
        return `md:${dbName}?motherduck_token=${process.env.MOTHERDUCK_TOKEN}`;
    } else {
        throw new Error(`*** Invalid DUCKDB_ENV: ${duckDbEnv}`);
    }
}
