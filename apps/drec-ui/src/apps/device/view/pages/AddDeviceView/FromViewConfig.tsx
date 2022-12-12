import { Paper, Table,TableBody,Typography, TableCell,TableContainer,TableHead,TableRow,Button,TablePagination} from '@mui/material';
import { useStyles } from './FromViewConfig.style';
import React, {useCallback,useEffect,useState} from 'react'
import {useDropzone} from 'react-dropzone';
import { fileUploadHandler, getAllJobDetailsOfOrganization, getJobDetailsForJobId, jobCreateForCSVFile } from 'api';
import { TableComponent,TableComponentProps, Requirements } from '@energyweb/origin-ui-core';
import { getAuthenticationToken } from 'shared';



// const useStyles = makeStyles({
//   table: {
//     minWidth: 650,
//   },
// });

// function App() {
  

//   useEffect(() => {
//     // async function fetchData() {
//     //   const response = await fetch('https://your-api-endpoint.com/data');
//     //   const json = await response.json();
//     //   setData(json);
//     }

//     // fetchData();
//   }, []);

//   const handleRefreshClick = () => {
//     // Fetch the data from the API again and update the data state variable
//     async function fetchData() {
//       const response = await fetch('https://your-api-endpoint.com/data');
//       const json = await response.json();
//       setData(json);
//     }

//     fetchData();
//   };

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(+event.target.value);
//     setPage(0);
//   };

export const AddSampleformValuePage = () => {

      const handleRefreshClick = () => {
    // Fetch the data from the API again and update the data state variable
    async function fetchData() {
      const response = await fetch('https://your-api-endpoint.com/data');
      const json = await response.json();
      setData(json);
    }

    fetchData();
  };

  const handleChangePage = (event:any, newPage:any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event:any) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

    const [data, setData] = useState([{id:1,name:'22',age:23}]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);


    const [tableProps, setTableProps] = useState<TableComponentProps<any>>({
        tableTitle: 'List Of Jobs',
        tableTitleProps: { variant: 'h5' },
        header: {
         "createdAt": "Created Date",
        "updatedAt": "Updated Date",
        "jobId": "Get Job Details",
        "status": "Status"
        },
        loading: false,
        //@ts-ignore
        data: [{id:"22",createdAt:"w2wq","updatedAt":"daas","jobId":"sas",status:"asas"}]
    });
    const [addedFiles, setAddedFiles] = useState<Array<File>>([]);
    const [jobDetailsLoading, setJobDetailsLoading] = useState<boolean>(true);

    const [jobListAdded, setJobListAdded] = useState<any>();

    const [jobIdToFetch, setJobIdToFetch] = useState<string>('');

    const onDrop = useCallback(acceptedFiles => {
        console.log("files");
        console.log("acceptedFiles",acceptedFiles);
        if(acceptedFiles.length>0)
        {
            setAddedFiles(acceptedFiles);
        }
        // Do something with the files
      }, [])

    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop,accept:['text/csv']});
    
    const classes = useStyles();
    useEffect(() => {
        if(addedFiles.length >0)
        {
            fileUploadHandler(addedFiles).then((response:Array<string>)=>{
                console.log("response",response);
                response.forEach(fileId=>{
                    jobCreateForCSVFile({fileName:fileId}).then(res=>{
                        if(res)
                        {
                            setJobListAdded(res);
                        }
                        console.log("job file response");
                        console.log("res",res);
                    })
                })
            }).catch(error=>{
                console.log("eror",error)
            });
        }

       
      }, [addedFiles]); // Only re-run the effect if count changes

      useEffect(() => {
        if(jobIdToFetch && jobIdToFetch.length >0)
        {
            //@ts-ignore
            getJobDetailsForJobId(jobIdToFetch).then((response:{
                id: number,
                jobId: number,
                errorDetails: {}
              })=>{
                console.log("response",response);
                
            }).catch(error=>{
                console.log("eror",error)
            });
        }

       
      }, [jobIdToFetch]);

      useEffect(() => {
        
            
            getAllJobDetailsOfOrganization().then((response)=>{
                console.log("response",response);
                if(response && response.data)
                {
                    //@ts-ignore
                    response.data.forEach(ele=>ele['id']=ele['jobId']);
                    console.log("response",response);
                    setTableProps({
                        tableTitle: 'List Of Jobs',
                        tableTitleProps: { variant: 'h5' },
                        header: {
                         "createdAt": "Created Date",
                        "updatedAt": "Updated Date",
                        "jobId": "Get Job Details",
                        "status": "Status"
                        },
                        loading: false,
                        //@ts-ignore
                        data: response.data
                    })

                }
              
                
            }).catch((error:any)=>{
                console.log("eror",error)
            });

       
      }, [jobListAdded]); // Only re-run the effect if count changes
      

    return (
        <div>
            <Paper className={classes.paper}>
            <Typography textAlign="center" variant="h6">
            <div {...getRootProps()}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                <p>Drop the CSV files here For Device Creation...</p> :
                <p>Drag 'n' drop CSV file here for devices registration, or click to select files</p>
            }
            </div>
            </Typography>
            </Paper>
            {getAuthenticationToken() && <div>
            {
                tableProps.data.length>0 &&
            
            <Paper className={classes.paper}>
              <TableComponent {...tableProps} />

            </Paper>
            }
            
            </div>}
            
            {/* <Button onClick={handleRefreshClick}>Refresh</Button>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell align="right">Name</TableCell>
              <TableCell align="right">Age</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(item => (
                <TableRow key={item.id}>
                  <TableCell component="th" scope="row">
                    {item.id}
                  </TableCell>
                  <TableCell align="right">{item.name}</TableCell>
                  <TableCell align="right">{item.age}</TableCell>
                  <TableCell align="right">
                    <Button onClick={() => handleRefreshClick()}>
                        Get Additional Data
                    </Button>
                    </TableCell>
                  
                </TableRow>))}
            </TableBody>
            </Table>
            <TablePagination rowsPerPageOptions={[5, 10, 25]}
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            </TableContainer> */}
        </div>
       
    );
};
