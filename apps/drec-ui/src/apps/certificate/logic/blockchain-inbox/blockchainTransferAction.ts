import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import { formatSelectedBlockchainItems } from './formatSelectedBlockchain';
import { SelectedItem, TUseBlockchainTransferActionLogic } from './types';

export const useBlockchainTransferActionLogic: TUseBlockchainTransferActionLogic<
    CertificateDTO['id']
> = ({ selectedIds, blockchainCertificates, allDeviceGroups, allFuelTypes }) => {
    const selectedItems: SelectedItem<CertificateDTO['id']>[] = selectedIds
        ? formatSelectedBlockchainItems({
              selectedIds,
              allDeviceGroups,
              blockchainCertificates,
              allFuelTypes
          })
        : [];

    return {
        title: 'Selected For Transfer',
        buttonText: 'Transfer',
        addressInputLabel: 'Blockchain address',
        selectedItems
    };
};
