import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import { EnergyTypeEnum, formatDate } from '@energyweb/origin-ui-utils';
import { PowerFormatter } from '../../../../utils';
import { getEnergyTypeImage } from '../../data';
import { getMainFuelType } from '../getMainFuelType';
import { TFormatSelectedBlockchainItems } from './types';

export const formatSelectedBlockchainItems: TFormatSelectedBlockchainItems = ({
    selectedIds,
    blockchainCertificates,
    allDeviceGroups,
    allFuelTypes
}) => {
    return selectedIds.map((selectedId) => {
        const certificate = blockchainCertificates.find(
            (item) => item.id === (selectedId as unknown as CertificateDTO['id'])
        );
        const matchingDeviceGroup = allDeviceGroups.find(
            (deviceGroup) => deviceGroup?.id.toString() === certificate.deviceId
        );

        const { mainType } = getMainFuelType(matchingDeviceGroup?.fuelCode, allFuelTypes);
        const icon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum, true);

        const startDate = formatDate(certificate.generationStartTime * 1000);
        const endDate = formatDate(certificate.generationEndTime * 1000);
        const generationTime = `${startDate} - ${endDate}`;
        return {
            id: selectedId,
            icon,
            deviceName: matchingDeviceGroup?.name,
            energy: PowerFormatter.format(Number(certificate.energy.publicVolume), true),
            generationTime
        };
    });
};
