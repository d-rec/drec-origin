import { EnergyFormatter, formatDate } from '@energyweb/origin-ui-utils';
import {
    TUseLogicRedemptionsReport,
    TFormatRedemptionsReportData,
    TFormatRedemptionsReportReturnData
} from './types';
import { useNavigate } from 'react-router-dom';
import { getFuelNameFromCode } from '../../../../utils';
import { CertificateMetadata } from '../../types';

const formatRedemptionsReportData: TFormatRedemptionsReportData = ({
    deviceGroups,
    blockchainCertificates,
    redeemedCertificates,
    allFuelTypes
}) => {
    return redeemedCertificates?.length > 0 && deviceGroups?.length > 0
        ? redeemedCertificates?.map((certificate, index) => {
              const compliance = 'I-REC';
              const fullCertificateData = blockchainCertificates.find(
                  (bc) => bc.id === certificate.id
              );
              const certificateMetadata = JSON.parse(
                  fullCertificateData?.metadata || ''
              ) as CertificateMetadata;

              // If device groups is not present (deleted) then we take device group from the certificate metadata
              const deviceGroup =
                  deviceGroups.find(
                      (deviceGroup) => +fullCertificateData?.deviceId === +deviceGroup.id
                  ) || certificateMetadata.deviceGroup;

              return {
                  id: `${certificate.id};${index}`,
                  fuelCode: getFuelNameFromCode(deviceGroup?.fuelCode, allFuelTypes),
                  country: deviceGroup?.countryCode,
                  capacityRange: deviceGroup?.capacityRange,
                  installations: deviceGroup?.installationConfigurations
                      .join()
                      .replaceAll(',', ', '),
                  offTakers: deviceGroup?.offTakers.join().replaceAll(',', ', '),
                  sectors: deviceGroup?.sectors.join().replaceAll(',', ', '),
                  commissioningDateRange: deviceGroup?.commissioningDateRange
                      .join()
                      .replaceAll(',', ', '),
                  standardCompliance: deviceGroup?.standardCompliance,
                  compliance,
                  redemptionDate: formatDate(certificate.claimData.periodStartDate),
                  certifiedEnergy: EnergyFormatter.getValueInDisplayUnit(
                      certificate.value
                  ).toString()
              };
          })
        : ([] as TFormatRedemptionsReportReturnData);
};

export const useLogicRedemptionsReport: TUseLogicRedemptionsReport = ({
    deviceGroups,
    blockchainCertificates,
    redeemedCertificates,
    allFuelTypes,
    loading
}) => {
    const navigate = useNavigate();
    return {
        header: {
            fuelCode: 'Fuel Code',
            country: 'Country',
            capacityRange: 'Capacity Range',
            installations: 'Installations',
            offTakers: 'Offtakers',
            sectors: 'Sectors',
            commissioningDateRange: 'Commissioning Date Range',
            standardCompliance: 'Standard Compliance',
            compliance: 'Compliance',
            redemptionDate: 'Redemption Date',
            certifiedEnergy: `Certified Energy (${EnergyFormatter.displayUnit})`
        },
        pageSize: 10,
        loading,
        data: formatRedemptionsReportData({
            deviceGroups,
            blockchainCertificates,
            redeemedCertificates,
            allFuelTypes
        }),
        onRowClick: (id) => {
            const certificateId = id.split(';')[0];
            navigate(`/certificate/detail-view/${certificateId}`);
        }
    };
};
