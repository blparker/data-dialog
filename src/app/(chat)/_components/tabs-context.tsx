'use client';

import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
    activeTab: string;
    switchToUploadTab: () => void;
    setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children, initialTab = '' }: { children: React.ReactNode; initialTab?: string }) {
    const [activeTab, setActiveTab] = useState<string>(initialTab);

    const switchToUploadTab = () => {
        setActiveTab('new');
    };

    return <TabsContext.Provider value={{ activeTab, switchToUploadTab, setActiveTab }}>{children}</TabsContext.Provider>;
}

export function useTabsContext() {
    const context = useContext(TabsContext);
    if (context === undefined) {
        throw new Error('useTabsContext must be used within a TabsProvider');
    }
    return context;
}
