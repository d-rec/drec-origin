import React, { FC, useState, useEffect } from 'react';
import { useStyles } from './simpleApiInvoke.style';
import { Paper } from '@mui/material';
import axios from 'axios';

import { CircularProgress, Grid } from '@mui/material';

import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';



export const AddSimpleAPICallViewPage: FC = () => {
  const classes = useStyles();

  const [keywords, setKeywords] = useState<any>();
  const [fetchedData, setFetchedData] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>(true);



  let fetchData = async ()=> {
    const  data  = await axios.get(
     `${process.env.REACT_APP_BACKEND_URL}/api/device-group`
    ).then(response=>{
      setFetchedData(response.data);

      setIsLoading(false);
      console.log("isloading",isLoading);
    showNotification(
        'Data fetched successfully',
        NotificationTypeEnum.Success
    );
    })
    
  }



  

  
  useEffect(() => {
    fetchData();
  }, [])

  if (isLoading) {
    return <CircularProgress />;
  }

  //   useEffect(() => {
  //     fetchData()
  //   }, [])

  const handleSubmit = (e: any) => {
    e.preventDefault()
    fetchData()
  }


  return (
    <Paper className={classes.paper}>
      <div className="input-field">
        <input
          placeholder="Search whatever you wish"
          type="text"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
        />
      </div>
      <button onClick={handleSubmit}> Click Here TO make API Call</button>
      
    </Paper>

  );
};