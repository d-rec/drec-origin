import { GenericModalProps } from '@energyweb/origin-ui-core';

type ModalLogicFunctionReturnType = Omit<GenericModalProps, 'open' | 'icon'>;

export type TRegisterThankYouLogic = (closeModal: () => void) => ModalLogicFunctionReturnType;

export type TOrganizationAlreadyExistsLogic = (
    closeModal: () => void
) => ModalLogicFunctionReturnType;
