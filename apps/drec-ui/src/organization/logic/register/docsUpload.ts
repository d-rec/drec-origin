import { TCreateDocsUploadForm } from './types';

export const createDocsUploadForm: TCreateDocsUploadForm = () => ({
    formTitle: 'Upload documents',
    formTitleVariant: 'h5',
    initialValues: {
        documentIds: [],
        signatoryDocumentIds: []
    },
    fields: null,
    validationSchema: null,
    customStep: true,
    buttonText: 'Submit'
});
