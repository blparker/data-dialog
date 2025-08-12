import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../_components/sidebar/sidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />

            <div className="flex h-screen w-full overflow-hidden relative">
                <SidebarTrigger className="absolute top-2 left-2 z-10 bg-background" />
                {children}
            </div>
        </SidebarProvider>
    );
}
