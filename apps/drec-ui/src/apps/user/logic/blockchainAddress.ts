export const useOrganizationBlockchainAddressLogic = () => {
    return {
        title: `Organization's Blockchain Account Address`,
        popoverText: [
            'This address is separate from the exchange deposit address. You need it if you want to manage the platform with your own blockchain address.',
            'A connected user blockchain address is required to withdraw certificates from the exchange and retire certificates.',
            'Select the right blockchain account in your MetaMask browser wallet and click “Connect Blockchain Address” to connect. Visit metamask.io to set up your own blockchain wallet.'
        ],
        operatorApprovalPopoverText: [
            'The user needs to give operator approval for the platform to automatically transfer certificates.'
        ],
        buttonText: 'Connect Blockchain Address',
        operatorApprovalButtonText: 'Give Operator Approval'
    };
};
