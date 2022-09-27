import * as Yup from 'yup';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import { useApiAddYieldValue } from 'apps/yieldconfiguration/data';
import { YieldvalueModalsActionsEnum, useYieldValueModalsDispatch } from '../../context';
import { STATUSTYPE_OPTIONS } from '../../../../../utils';

export type TUserSignInFormValues = {
  
    countryName: string,
    countryCode: string,
    yieldValue: 0,
    status: "Y"
};

const INITIAL_FORM_VALUES: TUserSignInFormValues = {
 
    countryName: '',
    countryCode: '',
    yieldValue: 0,
    status: "Y"
};

export const useYieldPageEffects = () => {
    const dispatchModals = useYieldValueModalsDispatch();

    const openYieldConfigModal = () =>
        dispatchModals({
            type: YieldvalueModalsActionsEnum.SHOW_Yieldvalue_Add,
            payload: true
        });

    const { submitHandler } = useApiAddYieldValue(openYieldConfigModal);
    const formConfig = useYieldInFormConfig(submitHandler);

    return { formConfig };
};

export const useYieldInFormConfig = (
    formSubmitHandler: GenericFormProps<TUserSignInFormValues>['submitHandler']
): GenericFormProps<TUserSignInFormValues> => {
    return {
        buttonText: 'Submit',
        fields: [
           
            {
                label: 'Country Name',
                name: 'countryName',
                required: true
            },
            {
                label: 'Country Code',
                name: 'countryCode',
                required: true
            },
            {
                label: 'Yield Value',
                name: 'yieldValue',
                required: true
            },
           
            {
                label: 'Status',
                name: 'status',
                select: true,
                options: STATUSTYPE_OPTIONS,
                additionalInputProps: {
                    valueToOpen: 'Other',
                    name: 'titleInput',
                    label: 'Type',
                    required: true
                }
            },
           

        ],
        twoColumns: true,
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: INITIAL_FORM_VALUES,
        submitHandler: formSubmitHandler,
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            
            countryName: Yup.string().label('Country Name').required(),
            countryCode: Yup.string().label('Country Code').required(),
            yieldValue: Yup.string().email().label('Yield Value').required(),         
            status: Yup.string().label('Status'),
            
        })
    };
};
