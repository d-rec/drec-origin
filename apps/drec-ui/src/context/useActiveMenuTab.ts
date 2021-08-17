import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

enum ActiveMenuItem {
    Device = 1,
    Organization = 2,
    Admin = 3,
    Account = 4
}

const useGetActiveTabFromLocation = (): ActiveMenuItem => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<ActiveMenuItem>(null);

    useEffect(() => {
        switch (location.pathname.split('/')[1].toString().toLowerCase()) {
            case 'device':
                setActiveTab(ActiveMenuItem.Device);
                return;
            case 'organization':
                setActiveTab(ActiveMenuItem.Organization);
                return;
            case 'admin':
                setActiveTab(ActiveMenuItem.Admin);
                return;
            case 'account':
                setActiveTab(ActiveMenuItem.Account);
        }
    }, [location]);
    return activeTab;
};

export const useActiveMenuTab = () => {
    const activeTab = useGetActiveTabFromLocation();

    const isDeviceTabActive = activeTab === ActiveMenuItem.Device;
    const isOrganizationTabActive = activeTab === ActiveMenuItem.Organization;
    const isAdminTabAcive = activeTab === ActiveMenuItem.Admin;
    const isAccountTabActive = activeTab === ActiveMenuItem.Account;

    return useMemo(
        () => ({
            isDeviceTabActive,
            isOrganizationTabActive,
            isAdminTabAcive,
            isAccountTabActive
        }),
        [activeTab]
    );
};
