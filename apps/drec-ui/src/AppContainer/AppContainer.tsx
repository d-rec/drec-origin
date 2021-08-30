import App from '../main/App';
import { DrecGlobalStyles } from '../main';
import { useAppContainerEffects } from './AppContainer.effects';
import { NotificationsCenter } from '../components';

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
