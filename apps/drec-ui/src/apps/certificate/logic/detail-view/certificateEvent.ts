import { PowerFormatter } from '@energyweb/origin-ui-utils';
import dayjs from 'dayjs';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { DetailedCertificate } from '../../types';

export const useCertificateBlockchainEventsLogic = (certificate: DetailedCertificate) => {
    const transformAddress = (address: string) => {
        if (address) {
            switch (getAddress(address)) {
                case '0x0000000000000000000000000000000000000000':
                    return 'Initial owner';
                default:
                    return address;
            }
        }
        return '';
    };

    // this any type is used here because CertificatEvent type does not contain all values
    // it actually returns. Same property names has different typing for different events (e.g. value / _value)
    const jointEvents =
        certificate.events?.length > 0
            ? certificate.events?.map((event: any) => {
                  let label: string;
                  let description: string;

                  switch (event.name) {
                      case 'IssuanceSingle':
                          label = 'Certified';
                          description = 'Local issuer approved the certification request';

                          break;
                      case 'TransferSingle':
                          if (event.from === '0x0000000000000000000000000000000000000000') {
                              label = 'Initial owner';
                              description = `Transfered ${PowerFormatter.format(
                                  BigNumber.from(event.value).toNumber(),
                                  true
                              )} to the ${transformAddress(event.to)} of the initial owner`;
                          } else if (event.to === '0x0000000000000000000000000000000000000000') {
                              label = '';
                              description = '';
                          } else {
                              label = 'Changed ownership';
                              description = `Transferred ${PowerFormatter.format(
                                  BigNumber.from(event.value).toNumber(),
                                  true
                              )} from ${transformAddress(event.from)} to ${transformAddress(
                                  event.to
                              )}`;
                          }
                          break;
                      case 'ClaimSingle':
                          label = 'Certificate claimed';
                          description = `Claimed ${PowerFormatter.format(
                              BigNumber.from(event._value).toNumber(),
                              true
                          )} by ${transformAddress(event._claimIssuer)}`;
                          break;

                      default:
                          label = event.name;
                  }

                  return {
                      txHash: event.transactionHash,
                      label,
                      description,
                      timestamp: event.timestamp * 1000
                  };
              })
            : [];

    const filteredEvents =
        jointEvents?.filter((event) => !!event.label || !!event.description) || [];

    const sortedEvents = filteredEvents.sort((a, b) => a.timestamp - b.timestamp).reverse();

    return sortedEvents;
};
