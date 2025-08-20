import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from './data-table';
import { DataSource, TransformationStep } from '@/lib/db/schema';
import { computePreviewSteps } from '@/lib/step-lib';
import { PlusIcon } from 'lucide-react';
import { useTabsContext } from './tabs-context';
import { UploadTabContent } from './new-data-source';

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
    const { activeTab, setActiveTab } = useTabsContext();

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
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
