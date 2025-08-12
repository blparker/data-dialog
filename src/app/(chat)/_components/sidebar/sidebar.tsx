import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenuButton } from '@/components/ui/sidebar';
import { Aperture, Database, MessageCirclePlus } from 'lucide-react';
import Link from 'next/link';
// import ChatHistory from './chat-history';
// import NewChatButton from './new-chat-button';

export default async function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Aperture className="w-6 h-6" />
                    DataDialog
                </h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    {/* <NewChatButton /> */}

                    <SidebarMenuButton asChild>
                        <Link href="/data">
                            <Database />
                            Data Sources
                        </Link>
                    </SidebarMenuButton>
                </SidebarGroup>

                {/* <ChatHistory /> */}
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}
