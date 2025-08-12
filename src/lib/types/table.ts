import { DataType } from './data';

export type TableRowType = Record<string, unknown>;

export type TableDataFetchResponse = {
    rows: TableRowType[];
    totalRows: number;
    currentPage: number;
};
