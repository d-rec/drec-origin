import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { EnergyTypeEnum, formatDate } from '@energyweb/origin-ui-utils';
import { Countries } from '@energyweb/utils-general';
import { PowerFormatter } from '../../../../utils';
import { getEnergyTypeImage } from '../../data';
import { getMainFuelType } from '../getMainFuelType';
import { BlockchainInboxContainers, TUseBlockchainInboxLogic } from './types';

export const useBlockchainInboxLogic: TUseBlockchainInboxLogic = ({
    blockchainCertificates,
    allDeviceGroups,
    allFuelTypes,
    actions,
    ListItemHeader,
    ListItemContent
}) => {
    const containers: BlockchainInboxContainers = new Map();
    const generationTimeTitle = 'Generation Time Frame';
    const viewButtonLabel = 'View';

    if (allDeviceGroups && blockchainCertificates) {
        allDeviceGroups.forEach((deviceGroup: DeviceGroupDTO) => {
            const deviceGroupCertificates = blockchainCertificates.filter(
                (certificate) =>
                    certificate.deviceId === deviceGroup.id.toString() &&
                    certificate.energy.publicVolume !== '0'
            );
            if (!deviceGroupCertificates) {
                return;
            }
            const certificatesMatchingDevice = blockchainCertificates.filter(
                (certificate) =>
                    certificate.deviceId === deviceGroup.id.toString() &&
                    parseInt(certificate.energy.publicVolume) > 0
            );
            if (certificatesMatchingDevice.length === 0) {
                return;
            }
            const countryName = Countries.find(
                (country) => country.code === deviceGroup.countryCode
            )?.name;
            const { mainType: deviceFuelType } = getMainFuelType(
                deviceGroup.fuelCode,
                allFuelTypes
            );
            const deviceIcon = getEnergyTypeImage(deviceFuelType as EnergyTypeEnum);

            containers.set(deviceGroup.id, {
                containerComponent: (
                    <ListItemHeader name={deviceGroup.name} country={countryName} />
                ),
                containerListItemProps: { style: { padding: 8 } },
                itemListItemProps: { style: { padding: 8 } },
                items: deviceGroupCertificates.map((certificate) => {
                    const startDate = formatDate(certificate.generationStartTime * 1000);
                    const endDate = formatDate(certificate.generationEndTime * 1000);
                    const generationTimeText = `${startDate} - ${endDate}`;
                    const formattedEnergy = PowerFormatter.formatDisplay(
                        parseInt(certificate.energy.publicVolume),
                        true
                    );
                    return {
                        id: certificate.id,
                        component: (
                            <ListItemContent
                                certificateId={certificate.id}
                                icon={deviceIcon}
                                fuelType={deviceFuelType}
                                energy={formattedEnergy}
                                generationTimeTitle={generationTimeTitle}
                                generationTimeText={generationTimeText}
                                viewButtonLabel={viewButtonLabel}
                            />
                        )
                    };
                })
            });
        });
    }

    return {
        listTitleProps: { gutterBottom: true, variant: 'h5' },
        itemsGridProps: { mt: 6 },
        checkboxes: true,
        listTitle: 'Blockchain Inbox',
        selectAllText: 'Select All',
        containers: containers,
        actions: actions,
        actionsTabsProps: { scrollButtons: false }
    };
};
