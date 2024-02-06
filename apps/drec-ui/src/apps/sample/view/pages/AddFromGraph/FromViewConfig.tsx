 import React, { FC,useEffect,useState } from 'react';
import { useStyles } from './FromViewConfig.style';
 import { Paper } from '@mui/material';
 import { CircularProgress, Grid } from '@mui/material';


 import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import { Bar } from 'react-chartjs-2';
import { getAllDevicesOfUserLoggedIn } from 'api';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  export const options:any = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart.js Bar Chart',
      },
    },
  };
  const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export const data:any = {
  labels,
  datasets: [
    {
      label: 'Dataset 1',
      data: labels.map(() => ((Math.random()*100)/Math.random())*10000 ),
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
    {
      label: 'Dataset 2',
      data: labels.map(() => ((Math.random()*100)/Math.random())*1300 ),
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
  ],
};



export const AddSampleGraphvaluePage: FC = () => {
   const classes= useStyles();
   const [isLoading, setIsLoading] = useState<boolean>(true);

   let fetchData = ()=> {
    console.log("isLoading",isLoading);
    getAllDevicesOfUserLoggedIn().then(result=>{
       //console.log("isLoading",isLoading);
        setIsLoading(false);
        console.log("result",result);
        

    });
    
  }

   useEffect(()=>{
    fetchData();
   },[])

   if (isLoading) {
    return <CircularProgress />;
   }
   
    return (
        <Paper className={classes.paper}>
             <Bar type="bar" options={options} data={data} />
        </Paper> 
       
    );
};