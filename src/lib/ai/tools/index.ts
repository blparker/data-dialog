import { DataSource } from '@/lib/db/schema';

export type ToolContext = {
    chatId: string;
    selectedDataSources: DataSource[];
};
