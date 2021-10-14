import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

enum ActiveMenuItem {
    Device = 1,
    DeviceGroup = 2,
    Certificate = 3,
    Organization = 4,
    Admin = 5,
    Account = 6
}

const useGetActiveTabFromLocation = (): ActiveMenuItem => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<ActiveMenuItem>(null);

    useEffect(() => {
        switch (location.pathname.split('/')[1].toString().toLowerCase()) {
            case 'device':
                setActiveTab(ActiveMenuItem.Device);
                return;
            case 'device-group':
                setActiveTab(ActiveMenuItem.DeviceGroup);
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
    const isDeviceGroupTabActive = activeTab === ActiveMenuItem.DeviceGroup;
    const isCertificateTabActive = activeTab === ActiveMenuItem.Certificate;
    const isOrganizationTabActive = activeTab === ActiveMenuItem.Organization;
    const isAdminTabAcive = activeTab === ActiveMenuItem.Admin;
    const isAccountTabActive = activeTab === ActiveMenuItem.Account;

    return useMemo(
        () => ({
            isDeviceTabActive,
            isDeviceGroupTabActive,
            isCertificateTabActive,
            isOrganizationTabActive,
            isAdminTabAcive,
            isAccountTabActive
        }),
        [activeTab]
    );
};
