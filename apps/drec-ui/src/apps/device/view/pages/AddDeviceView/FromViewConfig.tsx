import { Paper, Typography } from '@mui/material';
import { useStyles } from './FromViewConfig.style';
import React, {useCallback,useEffect,useState} from 'react'
import {useDropzone} from 'react-dropzone';
import { fileUploadHandler, getAllJobDetailsOfOrganization, getJobDetailsForJobId, jobCreateForCSVFile } from 'api';
import { TableComponent,TableComponentProps, Requirements } from '@energyweb/origin-ui-core';
import { getAuthenticationToken } from 'shared';

export const AddSampleformValuePage = () => {


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
      
      

    const noDeviceGroupTitle = 'Currently you don`t have any device groups';
    const noDeviceGroupDescription =
        'You can add new device groups to D-REC Origin by registering a new one.';

    return (
        <div>
            {getAuthenticationToken() && <div>
            {
                tableProps.data.length>0 &&
            
            <Paper className={classes.paper}>
              <TableComponent {...tableProps} />

            </Paper>
            }
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
            </div>}
            <Paper className={classes.paper}>
            <Typography textAlign="center" variant="h6">
                {noDeviceGroupTitle}
            </Typography>
            <Typography textAlign="center">{noDeviceGroupDescription}</Typography>
        </Paper>
        </div>
       
    );
};
