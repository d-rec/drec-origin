import { OrganizationDTO } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import { COUNTRY_OPTIONS_ISO } from '@energyweb/origin-ui-utils';
import * as Yup from 'yup';
import { BUSINESS_LEGAL_TYPE_OPTIONS } from '../../../organization/logic/select-options';
import { ORGANIZATION_STATUS_OPTIONS } from './statusOptions';

export type TAdminUpdateOrganizationFormValues = {
    name: OrganizationDTO['name'];
    address: OrganizationDTO['address'];
    zipCode: OrganizationDTO['zipCode'];
    city: OrganizationDTO['city'];
    country: OrganizationDTO['country'];
    businessType: OrganizationDTO['organizationType'];
    // tradeRegistryCompanyNumber: OrganizationDTO['tradeRegistryCompanyNumber'];
    // vatNumber: OrganizationDTO['vatNumber'];
    status: OrganizationDTO['status'];
};

export const useAdminUpdateOrganizationFormLogic = (
    organization: OrganizationDTO
): Omit<GenericFormProps<TAdminUpdateOrganizationFormValues>, 'submitHandler'> => {
    const initialFormData = {
        name: organization?.name,
        address: organization?.address,
        zipCode: organization?.zipCode,
        city: organization?.city,
        country: organization?.country,
        businessType: organization?.organizationType,
        // tradeRegistryCompanyNumber: organization?.tradeRegistryCompanyNumber,
        // vatNumber: organization?.vatNumber,
        status: organization?.status
    };

    return {
        formTitle: 'Organization information',
        formTitleVariant: 'h5',
        buttonText: 'Save',
        fields: [
            {
                label: 'Name',
                name: 'name',
                required: true
            },
            {
                label: 'Address',
                name: 'address',
                required: true
            },
            {
                label: 'Zip Code',
                name: 'zipCode',
                required: true
            },
            {
                label: 'City',
                name: 'city',
                required: true
            },
            {
                label: 'Country',
                name: 'country',
                select: true,
                options: COUNTRY_OPTIONS_ISO,
                required: true
            },
            {
                label: 'Business Type',
                name: 'businessType',
                select: true,
                options: BUSINESS_LEGAL_TYPE_OPTIONS,
                required: true
            },
            // {
            //     label: 'Trade Registry Company Number',
            //     name: 'tradeRegistryCompanyNumber',
            //     required: true
            // },
            // {
            //     label: 'VAT Number',
            //     name: 'vatNumber',
            //     required: true
            // },
            {
                label: 'Status',
                name: 'status',
                select: true,
                options: ORGANIZATION_STATUS_OPTIONS,
                required: true
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: initialFormData,
        twoColumns: true,
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            name: Yup.string().label('Name').required(),
            address: Yup.string().label('Address').required(),
            zipCode: Yup.string().label('Email').required(),
            city: Yup.string().label('City').required(),
            country: Yup.string().label('Country').required(),
            // businessType: Yup.string().label('Business Type').required(),
            // tradeRegistryCompanyNumber: Yup.string()
              //  .label('Trade Registry Company Number')
              //  .required(),
            //vatNumber: Yup.string().label('VAT Number').required()
        })
    };
};
