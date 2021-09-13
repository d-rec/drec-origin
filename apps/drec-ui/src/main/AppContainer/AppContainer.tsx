import { App } from '../App';
import { DrecGlobalStyles } from '../DrecGlobalStyles';
import { useAppContainerEffects } from './AppContainer.effects';
import { NotificationsCenter } from 'shared';

export const AppContainer = () => {
    const { topbarButtons, menuSections, user, isAuthenticated, routesConfig } =
        useAppContainerEffects();

    return (
        <>
            <DrecGlobalStyles />
            <NotificationsCenter />
            <App
                menuSections={menuSections}
                user={user}
                isAuthenticated={isAuthenticated}
                topbarButtons={topbarButtons}
                routesConfig={routesConfig}
            />
        </>
    );
};
