import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

enum ActiveMenuItem {
    Device = 1,
    Certificate = 2,
    Organization = 3,
    Admin = 4,
    Account = 5
}

const useGetActiveTabFromLocation = (): ActiveMenuItem => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<ActiveMenuItem>(null);

    useEffect(() => {
        switch (location.pathname.split('/')[1].toString().toLowerCase()) {
            case 'device':
                setActiveTab(ActiveMenuItem.Device);
                return;
            case 'certificate':
                setActiveTab(ActiveMenuItem.Certificate);
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
    const isCertificateTabActive = activeTab === ActiveMenuItem.Certificate;
    const isOrganizationTabActive = activeTab === ActiveMenuItem.Organization;
    const isAdminTabAcive = activeTab === ActiveMenuItem.Admin;
    const isAccountTabActive = activeTab === ActiveMenuItem.Account;

    return useMemo(
        () => ({
            isDeviceTabActive,
            isCertificateTabActive,
            isOrganizationTabActive,
            isAdminTabAcive,
            isAccountTabActive
        }),
        [activeTab]
    );
};
