export const useUserRegisteredModalLogic = (closeModal: () => void) => {
    return {
        title: 'Thanks for registering as a user on the marketplace',
        text: 'You should have received an E-Mail from us. In order to activate your user, please confirm your E-Mail address by clicking the confirmation link in the E-Mail',
        buttons: [
            {
                label: 'Ok',
                onClick: closeModal
            }
        ]
    };
};
