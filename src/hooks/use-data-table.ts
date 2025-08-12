import { mockDataAtStep, mockDeleteColumns, mockSchemaAtStep } from '@/hooks/use-mock-data';
import { dataAtStep, schemaAtStep } from '@/lib/db/actions/data';
import { DataField } from '@/lib/types/data';
import { TableDataFetchResponse, TableRowType } from '@/lib/types/table';
import { DragEndEvent, DragOverEvent, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef, useState } from 'react';

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

export function useVirtualizedTable({
    allRows,
    schema,
    columnOrder,
}: {
    allRows: TableRowType[];
    schema: DataField[];
    columnOrder: DataField[];
}) {
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const columnDefs: ColumnDef<TableRowType>[] = useMemo(() => {
        const columnsToUse = columnOrder && columnOrder.length > 0 ? columnOrder : schema;

        return columnsToUse.map((col) => ({
            id: col.id,
            accessorKey: col.name,
            header: col.name,
            // size: columnWidths.columnWidths[col.id] || DEFAULT_COLUMN_WIDTH,
            minSize: MIN_COLUMN_WIDTH,
            maxSize: MAX_COLUMN_WIDTH,
            enableSorting: true,
            enableColumnFilter: true,
        }));
    }, [columnOrder, schema]);

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

    return {
        table,
        tableContainerRef,
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

export function useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold = SCROLL_THRESHOLD,
}: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    threshold?: number;
}) {
    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

            if (isNearBottom && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]
    );

    return { handleScroll };
}

export function useColumnReorder(columnOrder: DataField[], setColumnOrder: React.Dispatch<React.SetStateAction<DataField[]>>) {
    const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveFieldId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (active.id !== over?.id) {
                setColumnOrder((prev) => {
                    const oldIndex = prev.findIndex((field) => field.id === active.id);
                    const newIndex = prev.findIndex((field) => field.id === over?.id);
                    return arrayMove(prev, oldIndex, newIndex);
                });
            }
            setActiveFieldId(null);
        },
        [setColumnOrder]
    );

    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            const { active, over } = event;
            if (active.id !== over?.id) {
                setColumnOrder((prev) => {
                    const oldIndex = prev.findIndex((field) => field.id === active.id);
                    const newIndex = prev.findIndex((field) => field.id === over?.id);
                    if (oldIndex !== -1 && newIndex !== -1) {
                        return arrayMove(prev, oldIndex, newIndex);
                    }
                    return prev;
                });
            }
        },
        [setColumnOrder]
    );

    return {
        sensors,
        activeFieldId,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
    };
}

export function useTableMutations({ chatId, stepId, useMockData = false }: { chatId: string; stepId: string; useMockData?: boolean }) {
    const queryClient = useQueryClient();

    const deleteColumnsMutation = useMutation({
        mutationFn: async ({ columnIds }: { columnIds: string[] }) => {
            if (useMockData) {
                return mockDeleteColumns({ columnIds });
            }

            // Real implementation - call your API
            // return await deleteTableColumns({ chatId, stepId, columnIds });
        },
        onSuccess: () => {
            // Invalidate and refetch schema to get updated column list
            queryClient.invalidateQueries({
                queryKey: ['table-schema', chatId, stepId],
            });
        },
        onError: (error) => {
            console.error('Failed to delete columns:', error);
            // You could add toast notification here
        },
    });

    const reorderColumnsMutation = useMutation({
        mutationFn: async ({ columnOrder }: { columnOrder: DataField[] }) => {
            if (useMockData) {
                return Promise.resolve({ success: true });
            }

            // return await updateTableColumnOrder({ chatId, stepId, columnOrder });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['table-schema', chatId, stepId],
            });
        },
        onError: (error) => console.error('Failed to delete columns:', error),
    });

    const renameColumnMutation = useMutation({
        mutationFn: async ({ columnId, newName }: { columnId: string; newName: string }) => {
            console.log('*** renameColumn', columnId, newName);
        },
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ['table-schema', chatId, stepId],
            }),
        onError: (error) => console.error('Failed to rename column:', error),
    });

    const deleteSelectedColumns = useCallback(
        ({ columnIds }: { columnIds: string[] }) => {
            if (columnIds.length === 0) return;

            deleteColumnsMutation.mutate({ columnIds });
        },
        [deleteColumnsMutation]
    );

    const reorderColumns = useCallback(
        (columnOrder: DataField[]) => {
            reorderColumnsMutation.mutate({ columnOrder });
        },
        [reorderColumnsMutation]
    );

    const renameColumn = useCallback(
        ({ columnId, newName }: { columnId: string; newName: string }) => {
            renameColumnMutation.mutate({ columnId, newName });
        },
        [renameColumnMutation]
    );

    return {
        deleteSelectedColumns,
        reorderColumns,
        renameColumn,
        isDeleting: deleteColumnsMutation.isPending,
        isReordering: reorderColumnsMutation.isPending,
        deleteError: deleteColumnsMutation.error,
        reorderError: reorderColumnsMutation.error,
        isRenaming: renameColumnMutation.isPending,
        renameError: renameColumnMutation.error,
    };
}
