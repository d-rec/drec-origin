import { TUseRegisterOrganizationFormLogic } from './types';
import { createOrgInfoForm } from './orgInfoForm';
import { createSignatoryInfoForm } from './signatoryInfoForm';
import { createDocsUploadForm } from './docsUpload';

export const useRegisterOrganizationFormLogic: TUseRegisterOrganizationFormLogic = () => {
    return {
        heading: 'Register New Organization',
        forms: [createOrgInfoForm(), createSignatoryInfoForm(), createDocsUploadForm()],
        backButtonText: 'Back'
    };
};
