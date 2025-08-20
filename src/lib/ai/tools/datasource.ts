import { allDataSources, countOfStepsForChat } from '@/lib/db/queries/datasource';
import { tool } from 'ai';
import { z } from 'zod';
import { ToolContext, ToolExecuteResult } from '.';
import { DataSource } from '@/lib/db/schema';
import { createStep } from '@/lib/db/queries/steps';
import { qi } from '@/lib/utils';
import { SourceStepData } from '@/lib/types/steps';

export const createTools = (ctx: ToolContext) => ({
    listDataSources: tool({
        description:
            'List all data sources that the user has uploaded along with whether the data sources are currently loaded in the chat',
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

    getActiveDataSource: tool({
        description: 'Get the data source that is currently active in the chat',
        inputSchema: z.object({}),
        execute: async (): Promise<ToolExecuteResult<{ dataSource: DataSource }>> => {
            return { ok: true, data: { dataSource: ctx.activeDataSource } };
        },
    }),

    selectDataSource: tool({
        description: 'Select a data source to use in the chat',
        inputSchema: z.object({
            dataSourceId: z.string(),
        }),
        execute: async ({ dataSourceId }: { dataSourceId: string }): Promise<ToolExecuteResult<void>> => {
            const sourceStepData: SourceStepData = {
                type: 'source',
                dataSourceId,
            };

            const count = await countOfStepsForChat({ chatId: ctx.chatId });
            const sql = `SELECT * FROM ${qi(dataSourceId)}`;
            const newSource = await createStep({
                newStep: { chatId: ctx.chatId, type: 'source', data: sourceStepData, writes: `t${count}`, sql },
            });

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
