export const useDeleteDeviceGroupModalLogic = (closeModal: () => void, deleteGroup: () => void) => {
    return {
        title: 'Delete device group?',
        text: 'Are you sure you want to delete this device group? This will remove all associated devices from this group!',
        buttons: [
            {
                label: 'Cancel',
                onClick: closeModal
            },
            {
                label: 'Confirm',
                onClick: deleteGroup
            }
        ]
    };
};
