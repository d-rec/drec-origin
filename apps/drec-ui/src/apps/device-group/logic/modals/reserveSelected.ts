export const useReserveSelectedModalLogic = (closeModal: () => void, reserve: () => void) => {
    return {
        text: 'Reserve all the selected device groups?',
        buttons: [
            {
                label: 'Cancel',
                onClick: closeModal
            },
            {
                label: 'Reserve',
                onClick: reserve
            }
        ]
    };
};
