import { IDevice } from '.';

export interface IDeviceGroup {
  id: number;
  name: string;
  organizationId: number;
  devices?: IDevice[];
}
