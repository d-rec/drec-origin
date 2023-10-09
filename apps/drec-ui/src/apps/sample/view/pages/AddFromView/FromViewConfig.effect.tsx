import * as Yup from 'yup';
import { GenericFormProps } from '@energyweb/origin-ui-core';
//import { useApiAddYieldValue } from 'apps/yieldconfiguration/data';
//import { SamplevalueModalsActionsEnum, useSampleValueModalsDispatch } from '../../context';
import { STATUSTYPE_OPTIONS } from '../../../../../utils';

export type TUserSignInFormValues = {

    firstname: string,
    lastname: string,
    mobileno: number,
    email: string;


};

const INITIAL_FORM_VALUES: TUserSignInFormValues = {

    firstname: '',
    lastname: '',
    mobileno: 0,
    email: '',

};

export const usesamplePageEffects = () => {
    // const dispatchModals = useSampleValueModalsDispatch();

    // const openYieldConfigModal = () =>
    //     dispatchModals({
    //         type: SamplevalueModalsActionsEnum.SHOW_Samplevalue_Add,
    //         payload: true
    //     });

    const  submitHandler  = (e:any) => {
        console.log("You submitted")
        e.preventDefault();
        alert(`You submitted`);
    }

    const formConfig = UseSampleInFormConfig(submitHandler);

    return { formConfig };
};

export const UseSampleInFormConfig = (
    formSubmitHandler: GenericFormProps<TUserSignInFormValues>['submitHandler']
): GenericFormProps<TUserSignInFormValues> => {
    return {
        buttonText: 'Submit',
        fields: [

            {
                label: 'First Name',
                name: 'firstname',
                required: true
            },
            {
                label: 'Last Name',
                name: 'lastname',
                required: true
            },
            {
                label: 'Mobile No.',
                name: 'mobileno',
                required: true
            },

            {
                label: 'Email',
                name: 'email',
                required: true
            },


        ],
        twoColumns: true,
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: INITIAL_FORM_VALUES,
        submitHandler: formSubmitHandler,
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({

            firstname: Yup.string().label('First Name').required(),
            lastname: Yup.string().label('Last Name').required(),
            mobileno: Yup.number().label('Mobile No.').required(),
            email: Yup.string().email().label('Email').required(),

        })
    };
};
