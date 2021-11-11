import { CertificateDTO, CodeNameDTO, DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { TableRowData, TableComponentProps } from '@energyweb/origin-ui-core';

export type TUseLogicRedemptionsReportArgs = {
    deviceGroups: DeviceGroupDTO[];
    blockchainCertificates: CertificateDTO[];
    redeemedCertificates: CertificateDTO['myClaims'];
    allFuelTypes: CodeNameDTO[];
    loading: boolean;
};

export type TFormatRedemptionsReportReturnData = TableRowData<string>[];

export type TFormatRedemptionsReportData = (
    props: Omit<TUseLogicRedemptionsReportArgs, 'loading'>
) => TFormatRedemptionsReportReturnData;

export type TUseLogicRedemptionsReport = (
    props: TUseLogicRedemptionsReportArgs
) => TableComponentProps<string>;
