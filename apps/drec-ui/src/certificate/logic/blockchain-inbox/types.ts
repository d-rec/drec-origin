import { CertificateDTO, CodeNameDTO, DeviceDTO } from '@energyweb/origin-drec-api-client';
import {
    ItemsListWithActionsProps,
    ListAction,
    TItemsListWithActionsContainers
} from '@energyweb/origin-ui-core';
import React, { FC } from 'react';

export interface ListItemContentProps<Id> {
    certificateId: Id;
    icon: FC<React.SVGProps<SVGSVGElement>>;
    fuelType: string;
    energy: string;
    generationTimeTitle: string;
    generationTimeText: string;
    viewButtonLabel: string;
}

export type TListItemContent = <Id>(
    props: React.PropsWithChildren<ListItemContentProps<Id>>
) => React.ReactElement;

type TUseBlockchainInboxLogicArgs = {
    blockchainCertificates: CertificateDTO[];
    allDevices: DeviceDTO[];
    allFuelTypes: CodeNameDTO[];
    actions: ListAction[];
    ListItemHeader: React.FC<{ name: string; country: string }>;
    ListItemContent: TListItemContent;
};

export type TUseBlockchainInboxLogic = (
    args: TUseBlockchainInboxLogicArgs
) => ItemsListWithActionsProps<DeviceDTO['id'], CertificateDTO['id']>;

export type BlockchainInboxContainers = TItemsListWithActionsContainers<
    DeviceDTO['id'],
    CertificateDTO['id']
>;

export type SelectedItem<Id> = {
    id: Id;
    icon: FC<React.SVGProps<SVGSVGElement>>;
    deviceName: string;
    energy: string;
    generationTime: string;
};

type TUseRetireActionLogicArgs<Id> = {
    selectedIds: Id[];
    blockchainCertificates: CertificateDTO[];
    allDevices: DeviceDTO[];
    allFuelTypes: CodeNameDTO[];
};

export type TUseRetireActionLogic<Id> = (args: TUseRetireActionLogicArgs<Id>) => {
    title: string;
    buttonText: string;
    selectedItems: SelectedItem<Id>[];
};

type TUseBlockchainTransferActionLogicArgs<Id> = {
    selectedIds: Id[];
    blockchainCertificates: CertificateDTO[];
    allDevices: DeviceDTO[];
    allFuelTypes: CodeNameDTO[];
};

export type TUseBlockchainTransferActionLogic<Id> = (
    args: TUseBlockchainTransferActionLogicArgs<Id>
) => {
    title: string;
    buttonText: string;
    addressInputLabel: string;
    selectedItems: SelectedItem<Id>[];
};

type FormatSelectedBlockchainItemsArgs<Id> = {
    selectedIds: Id[];
    blockchainCertificates: CertificateDTO[];
    allDevices: DeviceDTO[];
    allFuelTypes: CodeNameDTO[];
};

export type TFormatSelectedBlockchainItems = <Id>(
    args: FormatSelectedBlockchainItemsArgs<Id>
) => SelectedItem<Id>[];
