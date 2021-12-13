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
        signatoryFullName: yup.string().label('Signatory Name'),
        signatoryAddress: yup.string().label('Signatory Address'),
        signatoryZipCode: yup.string().label('Zip code'),
        signatoryCity: yup.string().label('City'),
        signatoryCountry: yup.array().label('Country'),
        signatoryEmail: yup.string().email().label('Signatory Email'),
        signatoryPhoneNumber: yup.string().label('Signatory phone number')
    }),
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
            label: 'Zip code'
        },
        {
            name: 'signatoryCity',
            label: 'City'
        },
        {
            name: 'signatoryCountry',
            label: 'Country',
            select: true,
            autocomplete: true,
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
    buttonText: 'Next Step'
});
