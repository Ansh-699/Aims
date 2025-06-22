import { useState, useCallback } from 'react';

export function useTabNavigation(defaultTab: string = 'home') {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    handleTabChange
  };
}
