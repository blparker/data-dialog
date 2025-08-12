import { DataSchema } from '@/lib/types/data';
import { TableDataFetchResponse, TableRowType } from '@/lib/types/table';

const numCols = 30;
const numRows = 500;

const mockData: TableRowType[] = Array.from({ length: numRows }).map((_, rowIdx) =>
    Object.fromEntries(Array.from({ length: numCols }).map((_, colIdx) => [`Column ${colIdx + 1}`, `Row ${rowIdx + 1} Col ${colIdx + 1}`]))
);

const mockSchema: DataSchema = Array.from({ length: numCols }).map((_, colIdx) => ({
    id: `col${colIdx + 1}`,
    name: `Column ${colIdx + 1}`,
    type: 'string',
}));

export function mockDataAtStep({ page, pageSize = 100 }: { page: number; pageSize?: number }): Promise<TableDataFetchResponse> {
    const rows = mockData.slice(page * pageSize, (page + 1) * pageSize);

    return Promise.resolve({
        rows,
        totalRows: mockData.length,
        currentPage: page,
    });
}

export function mockSchemaAtStep({ stepId }: { stepId: string }): Promise<DataSchema> {
    return Promise.resolve(mockSchema);
}
