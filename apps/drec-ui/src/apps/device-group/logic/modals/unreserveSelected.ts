export const useUnreserveSelectedModalLogic = (closeModal: () => void, unreserve: () => void) => {
    return {
        text: 'Unreserve all the selected device groups?',
        buttons: [
            {
                label: 'Cancel',
                onClick: closeModal
            },
            {
                label: 'Uneserve',
                onClick: unreserve
            }
        ]
    };
};
