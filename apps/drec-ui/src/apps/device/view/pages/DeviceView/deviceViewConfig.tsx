import React, { FC, useState, useEffect } from 'react';

import {useDeviceConfigEffects} from './deviceViewConfig.effect'
import { TableComponent } from '@energyweb/origin-ui-core';
import axios from 'axios';
// import { GenericForm } from '@energyweb/origin-ui-core';
// //import { usesamplePageEffects } from './FromViewConfig.effect';

export const DeviceListViewPage: FC = () => {
  const tableProps = useDeviceConfigEffects();

    return <TableComponent {...tableProps} />;
};