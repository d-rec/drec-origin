import React, { FC, useState, useEffect } from 'react';
import { useStyles } from './tableViewConfig.style';
import { Paper } from '@mui/material';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import { CircularProgress, Grid } from '@mui/material';

import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { TableComponent, TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';

import { DeviceDTO } from '@energyweb/origin-drec-api-client';

import { getAllDevicesOfUserLoggedIn } from 'api';


export const AddSampleListViewPage: FC = () => {
  const classes = useStyles();

  const [tableProps, setTableProps] = useState<TableComponentProps<DeviceDTO['id']>>({
    header: {
      externalId: "externalId",
      status: "Status",
      organizationId: "Organization ID",
      countryCode: "Country Code",
      fuelCode: "Fuel Code",
      deviceTypeCode: "Device Type Code",
      capacity: "Capacity",
      commissioningDate: "Commissioning Date",

    },
    loading: true,
    pageSize: 25,
    data: []
  });

  /*
  TableComponentProps definition
  {
        header: {
            no: 'No',
            projectName: 'Project name',
            externalId: 'External ID',
            status: 'Status',
            address: 'Address',
            installation: 'Installation',
            capacity: 'Capacity',
            age: 'Age',
            offTaker: 'Offtaker',
            sector: 'Sector',
            standardCompliance: 'Standard Compliance',
            actions: 'Details'
        },
        loading,
        pageSize: 25,
        data: devices?.map((device, index) => prepareDevicesData(device, actions, index)) ?? []
    };
*/

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  let fetchData = () => {
    console.log("isLoading", isLoading);
    getAllDevicesOfUserLoggedIn().then(result => {
      //console.log("isLoading",isLoading);
      setIsLoading(false);
      console.log("result", result);
      result.data.forEach(ele => {
        //@ts-ignore
        ele.commissioningDate = <Button variant="contained">Hello World</Button>;
      })

      setTableProps({
        header: {
          externalId: "externalId",
          status: "Status",
          organizationId: "Organization ID",
          projectName: "Project Name",
          countryCode: "Country Code",
          fuelCode: "Fuel Code",
          deviceTypeCode: "Device Type Code",
          capacity: "Capacity",
          commissioningDate: "Commissioning Date",
        },
        loading: false,
        pageSize: 25,
        data: result.data
      });


    });

  }

  useEffect(() => {
    fetchData();
  }, [])

  if (isLoading) {
    return <CircularProgress />;
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    fetchData()
  }

  return (
    <Paper className={classes.paper}>

      <TableComponent {...tableProps} />

    </Paper>

  );
  /* uncomment to check for popover
    return (
      <Paper className={classes.paper}>
  
        <Button aria-describedby={id} variant="contained" onClick={handleClick}>
          Open Popover
        </Button>
  
  
        <TableComponent {...tableProps} />
  
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={{ top: 800, left: 400 }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          The content of the Popover.
        </Popover>
  
  
      </Paper>
  
    );
  
    */
};