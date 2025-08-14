import FullScreenMessage from '@/components/full-screen-message';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    useColumnReorder,
    useInfiniteScroll,
    useTableData,
    useTableMutations,
    useTableSchema,
    useVirtualizedTable,
} from '@/hooks/use-data-table';
import { DataField } from '@/lib/types/data';
import { TableRowType } from '@/lib/types/table';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { Column, flexRender, Header } from '@tanstack/react-table';
import { ArrowDownAZ, ArrowUpZA, Edit, Filter, MoreVertical, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SCROLL_THRESHOLD = 200;
const DEFAULT_ROW_HEIGHT = 40;
const HEADER_HEIGHT = 40;
const USE_MOCK_DATA = false;

export default function DataTable({ chatId, stepId }: { chatId: string; stepId: string }) {
    const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
    // const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
    const [columnOrder, setColumnOrder] = useState<DataField[]>([]);

    const { data: schema, isLoading: isSchemaLoading, error: schemaError } = useTableSchema({ chatId, stepId, useMockData: USE_MOCK_DATA });
    const {
        data,
        error: dataError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useTableData({ chatId, stepId, useMockData: USE_MOCK_DATA });
    const { handleScroll } = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });
    const { handleDragStart, handleDragEnd, handleDragOver, sensors } = useColumnReorder(columnOrder, setColumnOrder);
    const { deleteSelectedColumns, renameColumn } = useTableMutations({ chatId, stepId, useMockData: USE_MOCK_DATA });

    const allRows = useMemo(() => data?.pages?.flatMap((page) => page.rows) ?? [], [data]);

    // Calculate dynamic row number column width based on total rows
    const rowNumberColumnWidth = useMemo(() => {
        const totalRows = allRows.length;
        if (totalRows === 0) return 30; // Minimum width

        // Calculate digits needed for the largest row number
        const maxDigits = Math.floor(Math.log10(totalRows)) + 1;

        // Base width: 20px padding + ~8px per digit + some buffer
        const calculatedWidth = Math.max(30, 8 + maxDigits * 6 + 8);

        // Cap at reasonable maximum width
        return Math.min(calculatedWidth, 80);
    }, [allRows.length]);

    const { table, tableContainerRef, rows, columns, totalHeight, totalWidth } = useVirtualizedTable({
        allRows,
        schema: schema ?? [],
        columnOrder,
    });

    useEffect(() => {
        if (schema) {
            setColumnOrder(schema);
        }
    }, [schema]);

    const handleFieldSelect = useCallback(
        (fieldId: string, event: React.MouseEvent) => {
            const isMultiSelect = event.ctrlKey || event.metaKey;
            const isRangeSelect = event.shiftKey;

            setSelectedFieldIds((prev) => {
                if (isMultiSelect) {
                    if (prev.includes(fieldId)) {
                        return prev.filter((id) => id !== fieldId);
                    } else {
                        return [...prev, fieldId];
                    }
                } else if (isRangeSelect) {
                    return getRangeFieldIds(prev, fieldId, schema);
                } else {
                    if (prev.length === 1 && prev[0] === fieldId) {
                        return [];
                    } else {
                        return [fieldId];
                    }
                }
            });
        },
        [schema]
    );

    const handleDeleteColumns = useCallback(
        (columnIds: string[]) => {
            setSelectedFieldIds((prev) => prev.filter((id) => !columnIds.includes(id)));
            deleteSelectedColumns({ columnIds });
        },
        [deleteSelectedColumns]
    );

    useEffect(() => {
        function onKeyPress(event: KeyboardEvent) {
            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedFieldIds.length > 0) {
                handleDeleteColumns(selectedFieldIds);
            }
        }
        window.addEventListener('keydown', onKeyPress);
        return () => window.removeEventListener('keydown', onKeyPress);
    }, [handleDeleteColumns, selectedFieldIds]);

    if (isSchemaLoading) {
        return <FullScreenMessage>Loading...</FullScreenMessage>;
    }

    if (schemaError || dataError) {
        return <FullScreenMessage className="text-destructive">Error loading data</FullScreenMessage>;
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            collisionDetection={closestCenter}
        >
            <div ref={tableContainerRef} onScroll={handleScroll} className="w-full h-full overflow-auto border-t border-l">
                <div className="relative" style={{ height: totalHeight, width: totalWidth }}>
                    <div className="sticky top-0 bg-background z-10 border-b" style={{ height: HEADER_HEIGHT, width: totalWidth }}>
                        {/* Row number header */}
                        <div
                            className="absolute top-0 font-medium cursor-default select-none px-2 py-1 border-r border-b bg-muted/50 flex items-center justify-center"
                            style={{
                                left: 0,
                                width: rowNumberColumnWidth,
                                height: HEADER_HEIGHT,
                            }}
                        >
                            #
                        </div>

                        <SortableContext items={columnOrder.map((field) => field.id)} strategy={horizontalListSortingStrategy}>
                            {columns.map(({ column, virtualColumn }) => {
                                const header = table.getHeaderGroups()[0]?.headers[virtualColumn.index];
                                const isSelected = selectedFieldIds.includes(column.id);

                                return (
                                    <DataTableHead
                                        key={column.id}
                                        field={column}
                                        header={header}
                                        isSelected={isSelected}
                                        onFieldSelect={handleFieldSelect}
                                        onRename={(columnId, newName) => renameColumn({ columnId, newName })}
                                        onDelete={() => handleDeleteColumns([column.id])}
                                        style={{
                                            left: virtualColumn.start + rowNumberColumnWidth, // Offset by row number column width
                                            width: virtualColumn.size,
                                            height: HEADER_HEIGHT,
                                        }}
                                    />
                                );
                            })}
                        </SortableContext>
                    </div>

                    <div className="relative">
                        {rows.map(({ row, virtualRow }) => {
                            const visibleCells = row.getVisibleCells();

                            return (
                                <div
                                    key={row.id}
                                    className="absolute inset-0"
                                    style={{
                                        top: virtualRow.start,
                                        left: 0,
                                        height: virtualRow.size,
                                        width: totalWidth,
                                    }}
                                >
                                    {/* Row number cell */}
                                    <div
                                        className="absolute border-r border-b flex items-center justify-center bg-muted/30 text-muted-foreground text-sm font-mono"
                                        style={{
                                            left: 0,
                                            width: rowNumberColumnWidth,
                                            height: virtualRow.size,
                                        }}
                                    >
                                        {virtualRow.index + 1}
                                    </div>

                                    {columns.map(({ virtualColumn }) => {
                                        const cell = visibleCells[virtualColumn.index];
                                        const isSelected = selectedFieldIds.includes(cell.column.id);

                                        return (
                                            <div
                                                key={cell.id}
                                                className={cn(
                                                    'absolute border-r border-b flex items-center px-2 overflow-hidden',
                                                    isSelected && 'bg-blue-50'
                                                )}
                                                style={{
                                                    left: virtualColumn.start + rowNumberColumnWidth, // Offset by row number column width
                                                    width: virtualColumn.size,
                                                    height: virtualRow.size,
                                                }}
                                            >
                                                <div className="truncate w-full">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DndContext>
    );
}

function DataTableHead({
    field,
    header,
    isSelected,
    onFieldSelect,
    onRename,
    onDelete,
    style,
}: {
    field: Column<TableRowType>;
    header: Header<TableRowType, unknown>;
    isSelected: boolean;
    onFieldSelect: (fieldId: string, event: React.MouseEvent) => void;
    onRename: (columnId: string, newName: string) => void;
    onDelete: (columnId: string) => void;
    style: React.CSSProperties;
}) {
    const [isRenaming, setIsRenaming] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id, disabled: isRenaming });
    const [newName, setNewName] = useState<string>(flexRender(header.column.columnDef.header, header.getContext()) as string);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onMouseDown={(e) => {
                if (!isRenaming) onFieldSelect(field.id, e);
            }}
            onDoubleClick={() => setIsRenaming(true)}
            className={cn(
                'absolute top-0 font-medium cursor-pointer select-none px-2 py-1 border-r flex items-center group',
                isSelected && 'bg-blue-500 text-white',
                isDragging && !isRenaming && 'cursor-ew-resize opacity-50'
            )}
        >
            {isRenaming ? (
                <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={() => setIsRenaming(false)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            setIsRenaming(false);
                            onRename(field.id, newName);
                        } else if (event.key === 'Escape') {
                            setNewName(flexRender(header.column.columnDef.header, header.getContext()) as string);
                            setIsRenaming(false);
                        }
                    }}
                    className={'px-1! h-8 text-md! bg-background text-primary'}
                />
            ) : (
                <div className="flex items-center justify-between w-full">
                    <div className="truncate">{newName}</div>
                    <FieldActionMenu
                        field={field}
                        isSelected={isSelected}
                        setIsRenaming={setIsRenaming}
                        onFieldSort={() => {}}
                        onFieldFilter={() => {}}
                        onFieldDelete={onDelete}
                    />
                </div>
            )}
        </div>
    );
}

function FieldActionMenu({
    field,
    isSelected,
    setIsRenaming,
    onFieldSort,
    onFieldFilter,
    onFieldDelete,
}: {
    field: Column<TableRowType>;
    isSelected: boolean;
    setIsRenaming: (isRenaming: boolean) => void;
    onFieldSort: (columnId: string, direction: 'asc' | 'desc') => void;
    onFieldFilter: (columnId: string, filterValue: string) => void;
    onFieldDelete: (columnId: string) => void;
}) {
    const [optimisticType, setOptimisticType] = useState<string | null>(null);
    // const [optimisticSelection, setOptimisticSelection] = useState<boolean>(isSelected);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    function withStopPropagation<T extends React.SyntheticEvent>(handler: (e: T) => void) {
        return (e: T) => {
            e.stopPropagation();
            setTimeout(() => handler(e), 0);
        };
    }

    return (
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger
                className={cn(
                    'rounded p-0.5 cursor-pointer hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity',
                    isSelected && 'hover:bg-blue-600',
                    isDropdownOpen && 'opacity-100'
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                {/* <MoreVertical className={cn('h-4 w-4 text-muted-foreground', optimisticSelection && 'text-white')} /> */}
                <MoreVertical className={cn('h-4 w-4 text-muted-foreground', isSelected && 'text-white')} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[1000]">
                {/* <DropdownMenuItem onClick={withStopPropagation((e) => onColumnSort(column.id, 'asc'))}> */}
                <DropdownMenuItem onClick={withStopPropagation((e) => onFieldSort(field.id, 'asc'))}>
                    <ArrowDownAZ />
                    Sort ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={withStopPropagation((e) => onFieldSort(field.id, 'desc'))}>
                    <ArrowUpZA />
                    Sort descending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={withStopPropagation((e) => setIsRenaming(true))}>
                    <Edit />
                    Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={withStopPropagation((e) => {
                        // For now, we'll implement a simple prompt-based filter. In a real app, you'd show a proper filter UI
                        const filterValue = prompt(`Filter ${field.id}:`, '');
                        if (filterValue !== null) {
                            onFieldFilter(field.id, filterValue);
                        }
                    })}
                >
                    <Filter />
                    Filter
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={withStopPropagation((e) => onFieldDelete(field.id))}
                    className="text-destructive hover:bg-red-50! hover:text-destructive!"
                >
                    <Trash2 className="text-destructive" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function getRangeFieldIds(prev: string[], fieldId: string, schema?: DataField[]) {
    // If no columns are selected, just select the clicked column
    if (prev.length === 0) {
        return [fieldId];
    }

    // If schema is not available, just select the clicked field
    if (!schema) {
        return [fieldId];
    }

    // Find the anchor column (first selected column) and the clicked column
    const anchorFieldId = prev[0]; // Use the first selected field as anchor
    const anchorIndex = schema.findIndex((field) => field.id === anchorFieldId);
    const clickedIndex = schema.findIndex((field) => field.id === fieldId);

    // If either field is not found, just select the clicked field
    if (anchorIndex === -1 || clickedIndex === -1) {
        return [fieldId];
    }

    // Select all fields between anchor and clicked (inclusive)
    const startIndex = Math.min(anchorIndex, clickedIndex);
    const endIndex = Math.max(anchorIndex, clickedIndex);

    const rangeFieldIds = schema.slice(startIndex, endIndex + 1).map((field) => field.id);

    return rangeFieldIds;
}
