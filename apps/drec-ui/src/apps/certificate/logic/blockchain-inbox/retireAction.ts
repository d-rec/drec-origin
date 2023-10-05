import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import * as yup from 'yup';
import { formatSelectedBlockchainItems } from './formatSelectedBlockchain';
import { SelectedItem, TUseBeneficiaryFormLogic, TUseRetireActionLogic } from './types';
import {countryCodeList} from './country-code-list';
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
            beneficiaryname:'',
            beneficiaryaddress :'',
            beneficiarycountrycode :'',
            startDate: '',
            endDate: '',
            purpose: ''
        },
        validationSchema: yup.object({
            beneficiaryname: yup.string().required().label('Beneficiary Name'),
            beneficiaryaddress: yup.string().required().label('Beneficiary Address'),
            beneficiarycountrycode: yup.string().required().label('Beneficiary Country Code'),
            startDate: yup.string().required().label('Start date'),
            endDate: yup.string().required().label('End date'),
            purpose: yup.string().required().label('Purpose')
        }),
        fields: [
            {
                name: 'beneficiaryname',
                label: 'Beneficiary Name',
                required:true,
                textFieldProps: {
                    variant: 'filled' as any,
                    margin: 'none'
                }
            },
            {
                name: 'beneficiaryaddress',
                label: 'Beneficiary Address',
                required:true,
                textFieldProps: {
                    variant: 'filled' as any,
                    margin: 'none'
                }
            },
            {
                name: 'beneficiarycountrycode',
                label: 'Beneficiary Country Code',
                required:true,
                options:countryCodeList,
                textFieldProps: {
                    variant: 'filled' as any,
                    margin: 'none'
                }
            },
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
