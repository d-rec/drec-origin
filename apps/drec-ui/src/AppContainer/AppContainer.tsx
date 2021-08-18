import React from 'react';
import App from '../main/App';
import { DrecGlobalStyles } from '../main';
import { useAppContainerEffects } from './AppContainer.effects';
import { NotificationsCenter } from '../core';

export const AppContainer = () => {
    const { topbarButtons, menuSections, user, organization, isAuthenticated } =
        useAppContainerEffects();

    return (
        <>
            <DrecGlobalStyles />
            <NotificationsCenter />
            <App
                menuSections={menuSections}
                user={user}
                organization={organization}
                isAuthenticated={isAuthenticated}
                topbarButtons={topbarButtons}
            />
        </>
    );
};
