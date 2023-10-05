
export interface IDeviceGroupNextIssueCertificate {
    id: number;
    groupId: number;
    start_date: string;
    end_date: string
    
}

export interface IHistoryDeviceGroupNextIssueCertificate {
    id: number;
    groupId: number;
    device_externalid:string;
    reservationStartDate: Date;
    reservationEndDate: Date;
    device_createdAt:Date
}
