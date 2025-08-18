import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from './data-table';
import { DataSource, TransformationStep } from '@/lib/db/schema';
import { computePreviewSteps } from '@/lib/step-lib';
import { PlusIcon } from 'lucide-react';
import { useTabsContext } from './tabs-context';

export default function DataPane({
    chatId,
    steps,
    previewSteps,
}: {
    chatId: string;
    steps: TransformationStep[];
    previewSteps: { step: TransformationStep; dataSource: DataSource | null }[];
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
                <TablePane chatId={chatId} steps={steps} previewSteps={previewSteps} />
            </div>
            <div className="h-20 flex-shrink-0">
                <LogPane chatId={chatId} steps={steps} />
            </div>
        </div>
    );
}

function TablePane({
    chatId,
    steps,
    previewSteps,
}: {
    chatId: string;
    steps: TransformationStep[];
    previewSteps: { step: TransformationStep; dataSource: DataSource | null }[];
}) {
    const defaultTab = previewSteps.length > 0 ? previewSteps[0].step.id : 'new';
    const { activeTab, setActiveTab } = useTabsContext();
    console.log('*** activeTab:', activeTab);

    return (
        <Tabs value={activeTab || defaultTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="flex justify-center">
                <TabsList className="flex-shrink-0">
                    {previewSteps.map(({ step, dataSource }) => (
                        <TabsTrigger key={step.id} value={step.id}>
                            {dataSource?.title ?? 'Unknown'}
                        </TabsTrigger>
                    ))}
                    <TabsTrigger value="new">
                        <PlusIcon />
                    </TabsTrigger>
                </TabsList>
            </div>
            {steps.map((step) => (
                <TabsContent key={step.id} value={step.id} className="flex-1 min-h-0">
                    <DataTable chatId={chatId} stepId={step.id} />
                </TabsContent>
            ))}
            <TabsContent value="new" className="flex-1 min-h-0">
                <UploadTabContent />
            </TabsContent>
        </Tabs>
    );
}

function UploadTabContent() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
                <div className="mb-4">
                    <PlusIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Data Source</h3>
                    <p className="text-gray-600 mb-6">Upload a CSV, Excel, or JSON file to get started with your data analysis.</p>
                </div>
                <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Choose File
                    </button>
                    <p className="text-sm text-gray-500">Supported formats: CSV, Excel (.xlsx, .xls), JSON</p>
                </div>
            </div>
        </div>
    );
}

function LogPane({ chatId, steps }: { chatId: string; steps: TransformationStep[] }) {
    return (
        <div className="h-full bg-red-50">
            <div className="flex gap-2 p-2">
                {steps.map((step) => (
                    <div key={step.id} className="border rounded p-2">
                        {step.data.type}
                    </div>
                ))}
            </div>
        </div>
    );
}
