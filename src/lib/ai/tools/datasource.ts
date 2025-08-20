import { z } from 'zod';
import { ToolContext, ToolExecuteResult } from '.';
import { tool } from 'ai';
import { DataSource } from '@/lib/db/schema';
import { dataSourcesForPreviewSteps } from '@/lib/db/actions/steps';
import { sortTransformationSteps } from '@/lib/step-lib';
import { createStep, stepsForChatId } from '@/lib/db/queries/steps';
import { allDataSources } from '@/lib/db/queries/datasource';

export const createTools = (ctx: ToolContext) => ({
    // getLoadedDataSources: tool({
    //     description: 'Get the data sources that are currently loaded in the chat',
    //     inputSchema: z.object({}),
    //     execute: async (): Promise<ToolExecuteResult<{ dataSources: DataSource[] }>> => {
    //         return {
    //             ok: true,
    //             data: {
    //                 dataSources: ctx.selectedDataSources,
    //             },
    //         };
    //     },
    // }),

    listDataSources: tool({
        description: 'List all data sources that the user has uploaded',
        inputSchema: z.object({}),
        execute: async (): Promise<
            ToolExecuteResult<{
                dataSources: {
                    id: string;
                    title: string;
                    contentType: string;
                    size: number;
                    createdAt: Date;
                    isCurrentlyLoaded: boolean;
                }[];
            }>
        > => {
            const allSources = await allDataSources();
            const previewDataSourcesById = new Map(ctx.selectedDataSources.map((ds) => [ds.id, ds]));

            const dataSources = allSources.map((source) => ({
                ...source,
                isCurrentlyLoaded: previewDataSourcesById.has(source.id),
            }));

            return {
                ok: true,
                data: {
                    dataSources,
                },
            };
        },
    }),

    selectDataSource: tool({
        description: 'Select a data source to use in the chat',
        inputSchema: z.object({
            dataSourceId: z.string(),
        }),
        execute: async ({ dataSourceId }: { dataSourceId: string }): Promise<ToolExecuteResult<void>> => {
            // const newStep = await createStep({ newStep: { chatId: ctx.chatId, type: 'source', data: { dataSourceId } } });
            return { ok: true, data: undefined };
        },
    }),

    uploadDataSource: tool({
        // description:
        //     'Upload a new data source. This tool is used to render an upload form that allows the user to upload/load a new data source',
        description:
            'This tool is used to point the user to the "New Data Source" tab to allow them to upload a new data source. This tool does not actually upload the data source',
        inputSchema: z.object({}),
        execute: async (): Promise<ToolExecuteResult<void>> => {
            return { ok: true, data: undefined };
        },
    }),
});
