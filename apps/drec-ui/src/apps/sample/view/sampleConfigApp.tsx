import { PageNotFound } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Grid } from '@mui/material';
// import { yi } from './containers';
//import { SampleValueModalsProvider } from './context';
import { AddSampleformValuePage, AddSampleGraphvaluePage, AddSampleListViewPage } from './pages'
interface OrganizationAppProps {
    routesConfig: {
        showaddForm: boolean,
        showTableList: boolean,

    };
}

export const SampleConfigApp: FC<OrganizationAppProps> = ({ routesConfig }) => {
    const { showaddForm, showTableList } = routesConfig;

    return (
             
            <Routes>
                <Route path="form" element={<AddSampleformValuePage/>} />
               
               
             <Route path="table" element={<AddSampleListViewPage/>} />

             <Route path="bar-graph" element={<AddSampleGraphvaluePage/>} />
            
         </Routes>

    );
};
