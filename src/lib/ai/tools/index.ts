import { DataSource } from '@/lib/db/schema';
import { createTools as createDataSourceTools } from './datasources';

export type ToolContext = {
    chatId: string;
    selectedDataSources: DataSource[];
};

export type ToolExecuteResult<T> =
    | {
          ok: true;
          data: T;
      }
    | {
          ok: false;
          error: string;
      };

export const createTools = (ctx: ToolContext) => ({
    ...createDataSourceTools(ctx),
});
