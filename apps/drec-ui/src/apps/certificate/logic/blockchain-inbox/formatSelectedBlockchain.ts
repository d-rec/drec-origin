import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import { EnergyTypeEnum, formatDate, PowerFormatter } from '@energyweb/origin-ui-utils';
import { getEnergyTypeImage, getMainFuelType } from '../../data';
import { TFormatSelectedBlockchainItems } from './types';

export const formatSelectedBlockchainItems: TFormatSelectedBlockchainItems = ({
    selectedIds,
    blockchainCertificates,
    allDevices,
    allFuelTypes
}) => {
    return selectedIds.map((selectedId) => {
        const certificate = blockchainCertificates.find(
            (item) => item.id === (selectedId as unknown as CertificateDTO['id'])
        );
        const matchingDevice = allDevices.find(
            (device) => device.id.toString() === certificate.deviceId
        );

        const { mainType } = getMainFuelType(matchingDevice.fuelCode, allFuelTypes);
        const icon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum, true);

        const startDate = formatDate(certificate.generationStartTime * 1000);
        const endDate = formatDate(certificate.generationEndTime * 1000);
        const generationTime = `${startDate} - ${endDate}`;
        return {
            id: selectedId,
            icon,
            deviceName: matchingDevice.projectName,
            energy: PowerFormatter.format(Number(certificate.energy.publicVolume), true),
            generationTime
        };
    });
};
