import React, { FC,useState, useEffect } from 'react';
import { useStyles } from './tableViewConfig.style';
import { Paper } from '@mui/material';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';


import axios from 'axios';
// import { GenericForm } from '@energyweb/origin-ui-core';
// //import { usesamplePageEffects } from './FromViewConfig.effect';

export const AddSampleListViewPage: FC = () => {
    const classes = useStyles();

    const [keywords, setKeywords] = useState<any>()
  const [fetchedData, setFetchedData] = useState<any>()

  let fetchData = async ()=> {
    const  data  = await axios.get(
      'http://127.0.0.1:3040/api/device-group'
    )
    setFetchedData(data)
    showNotification(
        'Data fetched successfully',
        NotificationTypeEnum.Success
    );
  }

//   useEffect(() => {
//     fetchData()
//   }, [])

  const handleSubmit = (e:any) => {
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

            {/* <table>
                <tr>
                    <td>Cell 1</td>
                    <td>Cell 2</td>
                    <td>Cell 3</td>
                </tr>
                <tr>
                    <td>Cell 4</td>
                    <td>Cell 5</td>
                    <td>Cell 6</td>
                </tr>
            </table> */}

        </Paper>

    );
};