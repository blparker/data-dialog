import { PlusIcon } from 'lucide-react';
import { useTabsContext } from '../tabs-context';

export default function ToolMessage({ toolName, children }: { toolName: string; children: React.ReactNode }) {
    switch (toolName) {
        case 'tool-listDataSources':
            return <ListDataSourcesTool />;
        case 'tool-uploadDataSource':
            return <UploadDataSourceTool />;
        default:
            return <div>{children}</div>;
    }
}

function ListDataSourcesTool() {
    return <div>ListDataSourcesTool</div>;
}

function UploadDataSourceTool() {
    const { switchToUploadTab } = useTabsContext();

    return (
        <button
            onClick={switchToUploadTab}
            className="flex items-center gap-2 p-4 border-2 border-dashed rounded-md transition-colors cursor-pointer w-full text-left bg-muted/80 hover:bg-muted text-neutral-600"
        >
            <PlusIcon />
            <span>Add a new data source</span>
        </button>
    );
}
