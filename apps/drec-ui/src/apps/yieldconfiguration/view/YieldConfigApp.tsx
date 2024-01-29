import { PageNotFound } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { Routes, Route } from 'react-router-dom';
// import { yi } from './containers';
import { YieldValueModalsProvider } from './context';
import {AddYieldValuePage,YieldConfigViewPage} from './pages'
interface OrganizationAppProps {
    routesConfig: {
        showaddyield:boolean ,
        showAllyield: boolean,
      
    };
}

export const YieldConfigApp: FC<OrganizationAppProps> = ({ routesConfig }) => {
    const { showaddyield, showAllyield } = routesConfig;

    return (
        <YieldValueModalsProvider>
            <Routes>
                <Route path="All" element={<YieldConfigViewPage/>} />
               
            </Routes>
            <Routes>
                <Route path="Add" element={<AddYieldValuePage/>} />
               
            </Routes>
        </YieldValueModalsProvider>
     );
};
