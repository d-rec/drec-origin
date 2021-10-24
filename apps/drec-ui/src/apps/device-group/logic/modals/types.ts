import { GroupedDevicesDTO } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';

type TCreateNewGroupFormValues = {
    groupName: string;
};

export type TCreateNewGroupFormLogic = (
    handleClose: () => void,
    group: GroupedDevicesDTO
) => Omit<GenericFormProps<TCreateNewGroupFormValues>, 'submitHandler'>;
