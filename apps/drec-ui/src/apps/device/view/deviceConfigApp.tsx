import { PageNotFound } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { Routes, Route } from 'react-router-dom';
// import { yi } from './containers';
//import { SampleValueModalsProvider } from './context';
import { AddSampleformValuePage, DeviceListViewPage } from './pages'
interface OrganizationAppProps {
    routesConfig: {
        showaddForm: boolean,
        showTableList: boolean,

    };
}

export const DeviceConfigApp: FC<OrganizationAppProps> = ({ routesConfig }) => {
    const { showaddForm, showTableList } = routesConfig;

    return (
             
            <Routes>
                <Route path="form" element={<AddSampleformValuePage/>} />
               
               
             <Route path="list" element={<DeviceListViewPage/>} />
            
         </Routes>

    );
};
