export const useLoginRegisterOrgModalLogic = (
    closeModal: () => void,
    navigateToRegister: () => void
) => {
    return {
        title: 'Thank you for registering as a user on the marketplace!',
        text: 'To unlock all the functionalities of the marketplace, like trading I-RECs, users also need to register an organization.',
        buttons: [
            {
                label: 'Not now',
                onClick: closeModal
            },
            {
                label: 'Register Organization',
                onClick: navigateToRegister
            }
        ]
    };
};
