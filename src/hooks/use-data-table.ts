import { dataAtStep, schemaAtStep } from '@/lib/db/actions/data';
import { mockDataAtStep, mockSchemaAtStep } from '@/hooks/use-mock-data';
import { DataField } from '@/lib/types/data';
import { TableDataFetchResponse, TableRowType } from '@/lib/types/table';
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult, useQuery } from '@tanstack/react-query';
import { Column, ColumnDef, flexRender, getCoreRowModel, Header, Row, Table, useReactTable } from '@tanstack/react-table';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef } from 'react';

export function useTableSchema({ chatId, stepId, useMockData = false }: { chatId: string; stepId: string; useMockData?: boolean }) {
    return useQuery({
        queryKey: ['table-schema', chatId, stepId],
        queryFn: async () => (useMockData ? mockSchemaAtStep({ stepId }) : await schemaAtStep({ chatId, stepId })),
        // staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

export function useTableData({
    chatId,
    stepId,
    useMockData = false,
}: {
    chatId: string;
    stepId: string;
    useMockData?: boolean;
}): UseInfiniteQueryResult<InfiniteData<TableDataFetchResponse>> {
    return useInfiniteQuery({
        queryKey: ['infinite-table-data', chatId, stepId],
        queryFn: async ({ pageParam = 0 }) =>
            useMockData ? mockDataAtStep({ page: pageParam }) : await dataAtStep({ chatId, stepId, page: pageParam }),
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce((sum, page) => sum + page.rows.length, 0);
            const hasMoreRows = totalFetched < lastPage.totalRows;
            const nextPage = lastPage.currentPage + 1;

            return hasMoreRows ? nextPage : undefined;
        },
        initialPageParam: 0,
        // staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
        // Keep previous data while loading new data (prevents UI flicker during sorting/filtering)
        placeholderData: (previousData) => previousData,
    });
}

const DEFAULT_ROW_HEIGHT = 40;
const HEADER_HEIGHT = 65;
const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;
// When the user is within 200px of the bottom of the table, fetch the next page
const SCROLL_THRESHOLD = 200;

export function useVirtualizedTable({ allRows, schema }: { allRows: TableRowType[]; schema: DataField[] }) {
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const columnDefs: ColumnDef<TableRowType>[] = useMemo(() => {
        return schema.map((col) => ({
            id: col.id,
            accessorKey: col.name,
            header: col.name,
            // size: columnWidths.columnWidths[col.id] || DEFAULT_COLUMN_WIDTH,
            minSize: MIN_COLUMN_WIDTH,
            maxSize: MAX_COLUMN_WIDTH,
            enableSorting: true,
            enableColumnFilter: true,
        }));
    }, [schema]);

    const table = useReactTable({
        data: allRows,
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel(),
    });

    const { rows } = table.getRowModel();
    const visibleColumns = table.getVisibleLeafColumns();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => DEFAULT_ROW_HEIGHT,
        overscan: 5,
    });

    const columnVirtualizer = useVirtualizer({
        count: visibleColumns.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: (index) => visibleColumns[index]?.getSize() ?? DEFAULT_COLUMN_WIDTH,
        horizontal: true,
        overscan: 3,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const virtualColumns = columnVirtualizer.getVirtualItems();

    // const totalSize = rowVirtualizer.getTotalSize();
    // const totalColumnWidth = columnVirtualizer.getTotalSize();

    // function onScroll(event: React.UIEvent<HTMLDivElement>) {
    //     const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    //     const isNearBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

    //     if (isNearBottom && hasNextPage && !isFetchingNextPage) {
    //         console.log('fetching next page');
    //         fetchNextPage();
    //     }
    // }

    // useEffect(() => {
    //     tableContainerRef.current?.addEventListener('scroll', onScroll);
    // }, []);

    return {
        table,
        tableContainerRef,
        // rows,
        rows: virtualRows.map((virtualRow) => ({
            row: rows[virtualRow.index],
            virtualRow,
        })),
        columns: virtualColumns.map((virtualColumn) => ({
            column: visibleColumns[virtualColumn.index],
            virtualColumn,
        })),
        totalHeight: rowVirtualizer.getTotalSize(),
        totalWidth: columnVirtualizer.getTotalSize(),
    };
}
