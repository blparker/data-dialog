import { PlusIcon, Upload, FileText, Calendar, Loader2, FileIcon, TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataSource } from '@/lib/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { filesize } from 'filesize';
import { createSourceStep } from '@/lib/db/actions/steps';
import { useTabsContext } from './tabs-context';
import { allDataSources } from '@/lib/db/actions/datasources';

export function NewDataSourceTabContent({ chatId }: { chatId: string }) {
    const {
        data: dataSources,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['data-sources'],
        queryFn: allDataSources,
    });

    const queryClient = useQueryClient();
    const { setActiveTab } = useTabsContext();

    const createSourceStepMutation = useMutation({
        mutationFn: createSourceStep,
        onSuccess: (newStep) => {
            // Switch to the new step tab
            setActiveTab(newStep.id);
            // Refresh the page to get updated steps
            window.location.reload();
        },
        onError: (error) => {
            console.error('Failed to create source step:', error);
            // You could add toast notification here
        },
    });

    const handleDataSourceSelect = (dataSourceId: string) => {
        createSourceStepMutation.mutate({ chatId, dataSourceId });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // TODO: Implement file upload functionality
            console.log('File selected:', file);
        }
    };

    function getFileIcon(contentType: string) {
        if (contentType.includes('csv')) return <FileIcon className="w-8 h-8 text-blue-700" />;
        if (contentType.includes('excel') || contentType.includes('spreadsheet')) return <TableIcon className="w-8 h-8 text-green-700" />;
        return <FileIcon className="w-8 h-8 " />;
    }

    return (
        <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
            {/* Upload Section */}
            <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Upload New Data Source</h3>
                    <p className="text-muted-foreground">Upload a CSV or Excel file to get started with your data analysis.</p>
                </div>
                <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center py-4">
                        <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                        <div className="text-center space-y-2">
                            <p className="font-medium">Drop your file here or click to browse</p>
                            <p className="text-sm text-muted-foreground">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                            <div className="mt-4">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                />
                                <Button asChild>
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <PlusIcon className="w-4 h-4" />
                                        Choose File
                                    </label>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Existing Data Sources Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Existing Data Sources</h3>
                        <p className="text-muted-foreground">Select from your previously uploaded data sources</p>
                    </div>
                    {dataSources && dataSources.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {dataSources.length} data source{dataSources.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="pb-3">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-3 bg-muted rounded w-1/2"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                                    <div className="h-3 bg-muted rounded w-2/3"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {error && (
                    <Card className="border-destructive/50">
                        <CardContent className="pt-6">
                            <p className="text-destructive text-center">Failed to load data sources. Please try again.</p>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && !error && dataSources && dataSources.length === 0 && (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                            <p className="text-center text-muted-foreground">No data sources found. Upload your first file above.</p>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && !error && dataSources && dataSources.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dataSources.map((dataSource) => (
                            <DataSourceCard
                                key={dataSource.id}
                                dataSource={dataSource}
                                getFileIcon={getFileIcon}
                                onSelect={handleDataSourceSelect}
                                isSelecting={createSourceStepMutation.isPending}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DataSourceCard({
    dataSource,
    getFileIcon,
    onSelect,
    isSelecting,
}: {
    dataSource: DataSource;
    getFileIcon: (contentType: string) => React.ReactNode;
    onSelect: (dataSourceId: string) => void;
    isSelecting: boolean;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                {/* <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getFileIcon(dataSource.contentType)}</span>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm font-medium truncate">{dataSource.title}</CardTitle>
                        </div>
                    </div>
                </div> */}
                {/* <CardDescription className="text-xs">{dataSource.contentType}</CardDescription> */}
                <div className="flex items-center gap-2 truncate">
                    {getFileIcon(dataSource.contentType)}
                    <CardTitle className="text-sm font-medium truncate">{dataSource.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span>Size:</span>
                        <span>{filesize(dataSource.size)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Uploaded:</span>
                        <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(new Date(dataSource.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 hover:bg-primary hover:text-primary-foreground cursor-pointer"
                    onClick={() => onSelect(dataSource.id)}
                    disabled={isSelecting}
                >
                    {isSelecting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Selecting...
                        </>
                    ) : (
                        'Select Data Source'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
