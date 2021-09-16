import { PageNotFound } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { Routes, Route } from 'react-router-dom';
import { OrganizationModalsCenter } from './containers';
import { OrganizationModalsProvider } from './context';
import {
    RegisterPage,
    OrganizationViewPage,
    MembersPage,
    InvitePage,
    InvitationsPage
} from './pages';

interface OrganizationAppProps {
    routesConfig: {
        showRegisterOrg: boolean;
        showMyOrg: boolean;
        showMembers: boolean;
        showInvitations: boolean;
        showInvite: boolean;
    };
}

export const OrganizationApp: FC<OrganizationAppProps> = ({ routesConfig }) => {
    const { showRegisterOrg, showMyOrg, showInvite, showMembers, showInvitations } = routesConfig;

    return (
        <OrganizationModalsProvider>
            <Routes>
                {showMyOrg && <Route path="my" element={<OrganizationViewPage />} />}
                {showInvitations && <Route path="invitations" element={<InvitationsPage />} />}
                {showInvite && <Route path="invite" element={<InvitePage />} />}
                {showMembers && <Route path="members" element={<MembersPage />} />}
                {showRegisterOrg && <Route path="register" element={<RegisterPage />} />}
                <Route path="*" element={<PageNotFound />} />
            </Routes>
            <OrganizationModalsCenter />
        </OrganizationModalsProvider>
    );
};
