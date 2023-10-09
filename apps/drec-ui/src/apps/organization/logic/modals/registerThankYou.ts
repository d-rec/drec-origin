import { TRegisterThankYouLogic } from './types';

export const useRegisterThankYouLogic: TRegisterThankYouLogic = (closeModal) => {
    return {
        title: 'Thank you for registering!',
        text: 'Your registration is reviewed by the platform administrator and you will be notified when your account is activated.',
        buttons: [
            {
                label: 'Ok',
                onClick: closeModal
            }
        ]
    };
};
