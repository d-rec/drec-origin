import { formatDate } from '@energyweb/origin-ui-utils';
import { EnergyFormatter } from '../../../../utils';
import { DetailedCertificate } from '../../types';

export const useCertificateDataLogic = (certificate: DetailedCertificate) => {
    return {
        certificateId: {
            title: 'Certificate ID',
            text: certificate.blockchainPart?.id?.toString() || '-'
        },
        claimed: {
            title: 'Claimed',
            text: certificate.blockchainPart?.isClaimed ? 'Yes' : 'No'
        },
        creationDate: {
            title: 'Creation Date',
            text: formatDate(certificate.blockchainPart?.creationTime * 1000)
        },
        generationStartDate: {
            title: 'Generation Start Date',
            text: formatDate(certificate.blockchainPart?.generationStartTime * 1000, true)
        },
        generationEndDate: {
            title: 'Generation End Date',
            text: formatDate(certificate.blockchainPart?.generationEndTime * 1000, true)
        },
        claimedEnergy: certificate.blockchainPart?.energy?.claimedVolume
            ? {
                  title: `Claimed Energy (${EnergyFormatter.displayUnit})`,
                  text: EnergyFormatter.format(certificate.blockchainPart.energy.claimedVolume)
              }
            : undefined,
        remainingEnergy: certificate.blockchainPart?.energy?.publicVolume
            ? {
                  title: `Remaining (unclaimed) Energy (${EnergyFormatter.displayUnit})`,
                  text: EnergyFormatter.format(certificate.blockchainPart.energy.publicVolume)
              }
            : undefined,
        claimBeneficiaries:
            certificate.blockchainPart?.claims?.length > 0
                ? {
                      title: 'Claim beneficiaries',
                      listItems: certificate.blockchainPart.claims.map((claim) => {
                          const { beneficiary, location, periodStartDate, periodEndDate, purpose } =
                              claim.claimData;
                          return `${beneficiary}, ${location}, [From: ${formatDate(
                              periodStartDate
                          )}, To: ${formatDate(periodEndDate)}], Purpose: ${purpose}`;
                      })
                  }
                : undefined
    };
};
