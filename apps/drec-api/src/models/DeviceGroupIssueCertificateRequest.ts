export interface IDeviceGroupNextIssueCertificate {
  id: number;
  groupId: number;
  start_date: string;
  end_date: string;
}

export interface IHistoryDeviceGroupNextIssueCertificate {
  id: number;
  groupId: number;
  device_externalid: string;
  reservationStartDate: Date;
  reservationEndDate: Date;
  device_createdAt: Date;
}

export interface IDeviceLateOngoingIssueCertificate {
  id: number;
  groupId: number;
  device_externalid: string;
  late_start_date: string;
  late_end_date: string;
  certificate_issued: boolean;
}
