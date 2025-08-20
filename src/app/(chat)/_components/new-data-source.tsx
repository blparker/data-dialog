import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UploadTabContent() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
                <div className="mb-4">
                    <PlusIcon className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Data Source</h3>
                    <p className="text-muted-foreground mb-6">Upload a CSV or Excel file to get started with your data analysis.</p>
                </div>
                <div className="space-y-3">
                    <Button>Choose File</Button>
                    <p className="text-xs text-muted-foreground">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                </div>
            </div>
        </div>
    );
}
