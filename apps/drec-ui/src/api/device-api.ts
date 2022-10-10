import axios from 'axios';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';

// export class DeviceDTOResponse 


export const getAllDevicesOfUserLoggedIn = async ():Promise<{
    data:Array<DeviceDTO>
}> => {
    return await axios.get(`api/device/my`);
};
