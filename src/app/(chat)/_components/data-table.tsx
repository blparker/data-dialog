import FullScreenMessage from '@/components/full-screen-message';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableData, useTableSchema, useVirtualizedTable } from '@/hooks/use-data-table';
import { DataField } from '@/lib/types/data';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column, flexRender, Header } from '@tanstack/react-table';
import { TableRowType } from '@/lib/types/table';

const SCROLL_THRESHOLD = 200;
const DEFAULT_ROW_HEIGHT = 40;
const HEADER_HEIGHT = 40;

export default function DataTable({ chatId, stepId }: { chatId: string; stepId: string }) {
    const { data: schema, isLoading: isSchemaLoading, error: schemaError } = useTableSchema({ chatId, stepId, useMockData: true });
    const {
        data,
        isLoading: isDataLoading,
        error: dataError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useTableData({ chatId, stepId, useMockData: true });

    const allRows = useMemo(() => data?.pages?.flatMap((page) => page.rows) ?? [], [data]);
    const { table, tableContainerRef, rows, columns, totalHeight, totalWidth } = useVirtualizedTable({
        allRows,
        schema: schema ?? [],
    });

    console.log('*** Re-rendering...');

    const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
    const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
    const [columnOrder, setColumnOrder] = useState<DataField[]>([]);

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

    useEffect(() => {
        if (schema) {
            setColumnOrder(schema);
        }
    }, [schema]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!schema) {
        return <FullScreenMessage>Loading...</FullScreenMessage>;
    }

    if (schemaError || dataError) {
        return <FullScreenMessage className="text-destructive">Error loading data</FullScreenMessage>;
    }

    function handleDragStart(event: DragStartEvent) {
        console.log('*** handleDragStart', event);
        setActiveFieldId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        console.log('*** handleDragEnd', event);
        const { active, over } = event;

        if (active.id != over?.id) {
            setColumnOrder((prev) => {
                const oldIndex = prev.findIndex((field) => field.id === active.id);
                const newIndex = prev.findIndex((field) => field.id === over?.id);

                return arrayMove(prev, oldIndex, newIndex);
            });
        }

        setActiveFieldId(null);
    }

    function handleDragOver(event: DragOverEvent) {
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
    }

    function handleScroll(e: React.UIEvent<HTMLDivElement>) {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

        if (isNearBottom && hasNextPage && !isFetchingNextPage) {
            console.log('fetching next page');
            fetchNextPage();
        }
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
                                        style={{
                                            left: virtualColumn.start,
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
                                                    left: virtualColumn.start,
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
    style,
}: {
    field: Column<TableRowType>;
    header: Header<TableRowType, unknown>;
    isSelected: boolean;
    onFieldSelect: (fieldId: string, event: React.MouseEvent) => void;
    style: React.CSSProperties;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onMouseDown={(e) => {
                onFieldSelect(field.id, e);
            }}
            className={cn(
                'absolute top-0 font-medium cursor-pointer select-none px-2 py-1 border-r flex items-center',
                isSelected && 'bg-blue-500 text-white',
                isDragging && 'cursor-ew-resize opacity-50'
            )}
        >
            {flexRender(header.column.columnDef.header, header.getContext())}
        </div>
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
