import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from './data-table';

export default function DataPane({ chatId }: { chatId: string }) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
                <TablePane chatId={chatId} />
            </div>
            <div className="h-20 bg-red-50 flex-shrink-0">Log</div>
        </div>
    );
}

function TablePane({ chatId }: { chatId: string }) {
    const steps = [
        {
            id: '07cf73fb-bdfd-4919-be51-9d46594229fa',
            name: 'Step 1',
        },
    ];

    return (
        <Tabs defaultValue={steps[0].id} className="flex flex-col h-full">
            <div className="flex justify-center">
                <TabsList className="flex-shrink-0">
                    {steps.map((step) => (
                        <TabsTrigger key={step.id} value={step.id}>
                            {step.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            {steps.map((step) => (
                <TabsContent key={step.id} value={step.id} className="flex-1 min-h-0">
                    <DataTable chatId={chatId} stepId={step.id} />
                </TabsContent>
            ))}
        </Tabs>
    );
}
