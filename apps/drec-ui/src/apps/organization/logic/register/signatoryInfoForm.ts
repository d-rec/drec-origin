import * as yup from 'yup';
import { COUNTRY_OPTIONS_ISO } from '@energyweb/origin-ui-utils';
import { TCreateSignatoryInfoForm } from './types';

export const createSignatoryInfoForm: TCreateSignatoryInfoForm = () => ({
    formTitle: 'Authorized Signatory Information',
    formTitleVariant: 'h5',
    inputsVariant: 'filled',
    initialValues: {
        signatoryFullName: '',
        signatoryAddress: '',
        signatoryZipCode: '',
        signatoryCity: '',
        signatoryCountry: [],
        signatoryEmail: '',
        signatoryPhoneNumber: ''
    },
    validationSchema: yup.object().shape({
        signatoryFullName: yup.string().required().label('Signatory Name'),
        signatoryAddress: yup.string().required().label('Signatory Address'),
        signatoryZipCode: yup.string().required().label('Zip code'),
        signatoryCity: yup.string().required().label('City'),
        signatoryCountry: yup.array().required().label('Country'),
        signatoryEmail: yup.string().email().required().label('Signatory Email'),
        signatoryPhoneNumber: yup.string().required().label('Signatory phone number')
    }),
    fields: [
        {
            name: 'signatoryFullName',
            label: 'Signatory Name',
            required: true
        },
        {
            name: 'signatoryAddress',
            label: 'Signatory Address',
            required: true
        },
        {
            name: 'signatoryZipCode',
            label: 'Zip code',
            required: true
        },
        {
            name: 'signatoryCity',
            label: 'City',
            required: true
        },
        {
            name: 'signatoryCountry',
            label: 'Country',
            select: true,
            autocomplete: true,
            options: COUNTRY_OPTIONS_ISO,
            required: true
        },
        {
            name: 'signatoryEmail',
            label: 'Signatory Email',
            required: true
        },
        {
            name: 'signatoryPhoneNumber',
            label: 'Signatory phone number',
            required: true
        }
    ],
    buttonText: 'Next Step'
});
