'use server';

import { allDataSources as allDataSourcesQuery } from '../queries/datasource';
import { DataSource } from '../schema';

export async function allDataSources(): Promise<DataSource[]> {
    return await allDataSourcesQuery();
}
