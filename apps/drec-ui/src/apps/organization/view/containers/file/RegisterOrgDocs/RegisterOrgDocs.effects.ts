import { UploadedFile } from '@energyweb/origin-ui-core';
import { useState } from 'react';
import { fileUploadHandler } from 'api';
import { DocsUploadFormValues } from 'apps/organization/logic';

export const useRegisterOrgDocsEffects = () => {
    const [companyProofs, setCompanyProofs] = useState<UploadedFile[]>([]);
    const [signatoryId, setSignatoryId] = useState<UploadedFile[]>([]);

    const values: DocsUploadFormValues = {
        documentIds: companyProofs.filter((doc) => !doc.removed).map((doc) => doc.uploadedName),
        signatoryDocumentIds: signatoryId
            .filter((doc) => !doc.removed)
            .map((doc) => doc.uploadedName)
    };
    const uploadText = 'Drop files here or click to select files';
    const companyProofHeading = 'Upload Company Proof';
    const signatoryIdTHeading = 'Upload Signatory ID';
    const uploadFunction = fileUploadHandler;
    const onCompanyProofsChange = (newValues: UploadedFile[]) => setCompanyProofs(newValues);
    const onSignatoryIdChange = (newValues: UploadedFile[]) => setSignatoryId(newValues);

    // Need to check why uploading handler is causing 500 Server Error on API
    // const buttonDisabled = companyProofs.length < 1 || signatoryId.length < 1; // Check this
    const buttonDisabled = false; // Check this
    const buttonText = 'Submit';

    return {
        values,
        uploadText,
        uploadFunction,
        onCompanyProofsChange,
        companyProofHeading,
        onSignatoryIdChange,
        signatoryIdTHeading,
        buttonDisabled,
        buttonText
    };
};
