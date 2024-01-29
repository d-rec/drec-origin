import { GroupedDevicesDTO } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';

export type TCreateNewGroupFormValues = {
    groupName: string;
    targetCapacityInMegaWattHour:number;
    reservationStartDate:string;
    reservationEndDate:string;
    continueWithReservationIfOneOrMoreDevicesUnavailableForReservation:boolean;
    continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration:boolean;
    authorityToExceed:boolean;
    frequency:string;

};

export type TCreateNewGroupFormLogic = (
    handleClose: () => void,
    group: GroupedDevicesDTO
) => Omit<GenericFormProps<TCreateNewGroupFormValues>, 'submitHandler'>;
