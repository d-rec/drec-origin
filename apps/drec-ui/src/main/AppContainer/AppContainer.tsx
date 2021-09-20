import { NotificationsCenter } from 'shared';
import { App } from '../App';
import { DrecGlobalStyles } from '../DrecGlobalStyles';
import { useAppContainerEffects } from './AppContainer.effects';

export const AppContainer = () => {
    const { topbarButtons, menuSections, user, isAuthenticated, routesConfig, isLoading } =
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
                loading={isLoading}
            />
        </>
    );
};
