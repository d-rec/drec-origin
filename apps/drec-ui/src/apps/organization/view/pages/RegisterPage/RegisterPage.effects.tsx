import { useOrganizationRegisterHandler } from 'apps/organization/data';
import { useRegisterOrganizationFormLogic } from 'apps/organization/logic';
import { OrganizationModalsActionsEnum, useOrgModalsDispatch } from '../../context';
import { RegisterOrgDocs } from '../../containers';

export const useRegisterPageEffects = () => {
    const dispatchModals = useOrgModalsDispatch();

    const openRoleChangedModal = () =>
        dispatchModals({
            type: OrganizationModalsActionsEnum.SHOW_ROLE_CHANGED,
            payload: true
        });

    const openAlreadyExistsModal = () =>
        dispatchModals({
            type: OrganizationModalsActionsEnum.SHOW_ORGANIZATION_ALREADY_EXISTS,
            payload: true
        });

    const submitHandler = useOrganizationRegisterHandler({
        openRoleChangedModal,
        openAlreadyExistsModal
    });
    const formsLogic = useRegisterOrganizationFormLogic();

    const formsWithDocsUpload = formsLogic.forms.map((form) =>
        form.customStep
            ? {
                  ...form,
                  component: RegisterOrgDocs
              }
            : form
    );

    const formData = {
        ...formsLogic,
        forms: formsWithDocsUpload,
        submitHandler
    };

    return { formData };
};
