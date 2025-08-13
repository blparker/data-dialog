import { db } from '@/lib/db';
import { dataSource } from '../schema';
import { eq } from 'drizzle-orm';

export async function dataSourceById({ id }: { id: string }) {
    try {
        const [ds] = await db.select().from(dataSource).where(eq(dataSource.id, id));
        return ds;
    } catch (error) {
        console.error('error while getting data source by id:', error);
        throw new Error('bad_request:database. Failed to get data source by id');
    }
}
