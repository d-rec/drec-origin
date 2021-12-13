import { OrganizationDTO } from '@energyweb/origin-drec-api-client';
import * as Yup from 'yup';
import { COUNTRY_OPTIONS_ISO } from '@energyweb/origin-ui-utils';
import { GenericFormProps } from '@energyweb/origin-ui-core';

export type TAdminUpdateOrganizationSignatoryInfoFormValues = {
    signatoryFullName: OrganizationDTO['signatoryFullName'];
    signatoryAddress: OrganizationDTO['signatoryAddress'];
    signatoryZipCode: OrganizationDTO['signatoryZipCode'];
    signatoryCity: OrganizationDTO['signatoryCity'];
    signatoryCountry: OrganizationDTO['signatoryCountry'];
    signatoryEmail: OrganizationDTO['signatoryEmail'];
    signatoryPhoneNumber: OrganizationDTO['signatoryPhoneNumber'];
};

export const useAdminUpdateOrganizationSignatoryInfoForm = (
    organization: OrganizationDTO
): Omit<GenericFormProps<TAdminUpdateOrganizationSignatoryInfoFormValues>, 'submitHandler'> => {
    const initialFormData = {
        signatoryFullName: organization?.signatoryFullName || '',
        signatoryAddress: organization?.signatoryAddress || '',
        signatoryZipCode: organization?.signatoryZipCode || '',
        signatoryCity: organization?.signatoryCity || '',
        signatoryCountry: organization?.signatoryCountry || '',
        signatoryEmail: organization?.signatoryEmail || '',
        signatoryPhoneNumber: organization?.signatoryPhoneNumber || ''
    };
    return {
        formTitle: 'Authorized Signatory Information',
        formTitleVariant: 'h5',
        buttonText: 'Save',
        fields: [
            {
                name: 'signatoryFullName',
                label: 'Signatory Name'
            },
            {
                name: 'signatoryAddress',
                label: 'Signatory Address'
            },
            {
                name: 'signatoryZipCode',
                label: 'Signatory Zip code'
            },
            {
                name: 'signatoryCity',
                label: 'Signatory City'
            },
            {
                name: 'signatoryCountry',
                label: 'Signatory Country',
                select: true,
                options: COUNTRY_OPTIONS_ISO
            },
            {
                name: 'signatoryEmail',
                label: 'Signatory Email'
            },
            {
                name: 'signatoryPhoneNumber',
                label: 'Signatory phone number'
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: initialFormData,
        twoColumns: true,
        acceptInitialValues: true,
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            signatoryFullName: Yup.string().label('Signatory Name'),
            signatoryAddress: Yup.string().label('Signatory Address'),
            signatoryZipCode: Yup.string().label('Signatory Zip code'),
            signatoryCity: Yup.string().label('Signatory City'),
            signatoryCountry: Yup.string().label('Signatory Country'),
            signatoryEmail: Yup.string().email().label('Signatory Email'),
            signatoryPhoneNumber: Yup.string().label('Signatory phone number')
        })
    };
};
