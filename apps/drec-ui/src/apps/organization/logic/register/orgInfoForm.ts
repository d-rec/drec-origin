import * as yup from 'yup';
import { BUSINESS_LEGAL_TYPE_OPTIONS } from '../select-options';
import { COUNTRY_OPTIONS_ISO } from '@energyweb/origin-ui-utils';
import { TCreateOrgInfoForm } from './types';

export const createOrgInfoForm: TCreateOrgInfoForm = () => ({
    formTitle: 'Organization information',
    formTitleVariant: 'h5',
    inputsVariant: 'filled',
    initialValues: {
        name: '',
        address: '',
        zipCode: '',
        city: '',
        country: [],
        organizationType: '',
        // tradeRegistryCompanyNumber: '',
        // vatNumber: ''
    },
    validationSchema: yup.object().shape({
        name: yup.string().required().label('Organization Name'),
        address: yup.string().required().label('Organization Address'),
        zipCode: yup.string().required().label('Zip code'),
        city: yup.string().required().label('City'),
        country: yup.array().required().label('Country'),
        organizationType: yup.string().required().label('Business Type'),
        // tradeRegistryCompanyNumber: yup.string().required().label('Trade Registry Company number'),
        // vatNumber: yup.string().required().label('VAT number')
    }),
    fields: [
        {
            name: 'name',
            label: 'Organization Name',
            required: true
        },
        {
            name: 'address',
            label: 'Organization Address',
            required: true
        },
        {
            name: 'zipCode',
            label: 'Zip code',
            required: true
        },
        {
            name: 'city',
            label: 'City',
            required: true
        },
        {
            name: 'country',
            label: 'Country',
            select: true,
            autocomplete: true,
            options: COUNTRY_OPTIONS_ISO,
            required: true
        },
        {
            name: 'businessType',
            label: 'Business Type',
            select: true,
            options: BUSINESS_LEGAL_TYPE_OPTIONS,
            required: true
        },
        // {
        //     name: 'tradeRegistryCompanyNumber',
        //     label: 'Trade Registry Company number',
        //     required: true
        // },
        // {
        //     name: 'vatNumber',
        //     label: 'VAT number',
        //     required: true
        // }
    ],
    buttonText: 'Next Step'
});
