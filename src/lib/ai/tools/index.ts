import { DataSource } from '@/lib/db/schema';
import { createTools as createDataSourceTools } from './datasource';

export type ToolContext = {
    chatId: string;
    selectedDataSources: DataSource[];
    activeDataSource: DataSource;
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
