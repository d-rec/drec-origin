import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import * as yup from 'yup';
import { formatSelectedBlockchainItems } from './formatSelectedBlockchain';
import { SelectedItem, TUseBeneficiaryFormLogic, TUseRetireActionLogic } from './types';

export const useRetireActionLogic: TUseRetireActionLogic<CertificateDTO['id']> = ({
    selectedIds,
    blockchainCertificates,
    allDeviceGroups,
    allFuelTypes
}) => {
    const selectedItems: SelectedItem<CertificateDTO['id']>[] = selectedIds
        ? formatSelectedBlockchainItems({
              selectedIds,
              allDeviceGroups,
              blockchainCertificates,
              allFuelTypes
          })
        : [];

    return {
        title: 'Selected For Redemption ',
        buttonText: 'Redeem',
        selectedItems
    };
};

export const useBeneficiaryFormLogic: TUseBeneficiaryFormLogic = () => {
    return {
        initialValues: {
            startDate: '',
            endDate: '',
            purpose: ''
        },
        validationSchema: yup.object({
            startDate: yup.string().required().label('Start date'),
            endDate: yup.string().required().label('End date'),
            purpose: yup.string().required().label('Purpose')
        }),
        fields: [
            {
                name: 'startDate',
                label: 'Start date',
                datePicker: true,
                textFieldProps: {
                    variant: 'filled' as any,
                    margin: 'none'
                }
            },
            {
                name: 'endDate',
                label: 'End date',
                datePicker: true,
                textFieldProps: {
                    variant: 'filled' as any,
                    margin: 'none'
                }
            },
            {
                name: 'purpose',
                label: 'Purpose',
                textFieldProps: {
                    variant: 'filled' as any,
                    margin: 'none'
                }
            }
        ]
    };
};
