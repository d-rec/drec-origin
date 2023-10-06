import { useEffect, useState } from 'react';
import { useTransactionPendingStore } from '../../../context';
import { CertificateActionContentProps } from './CertificateActionContent';

type EnergyAmounts<Id> = {
    id: Id;
    amount: string;
};

export const useCertificateActionContentEffects = <Id>(
    selectedIds: Id[],
    selectedItems: CertificateActionContentProps<Id>['selectedItems'],
    submitHandler: CertificateActionContentProps<Id>['submitHandler'],
    setTotalAmount?: CertificateActionContentProps<Id>['setTotalAmount']
) => {
    const [editMode, setEditMode] = useState(false);
    const [energyAmounts, setEnergyAmounts] = useState<EnergyAmounts<Id>[]>([]);
    const txPending = useTransactionPendingStore();

    const addOrRemoveEnergyOnCheck = (
        ids: Id[],
        items: CertificateActionContentProps<Id>['selectedItems']
    ) => {
        if (ids.length > energyAmounts.length) {
            let newItems: EnergyAmounts<Id>[] = [];
            ids.forEach((id) => {
                const alreadyIncluded = energyAmounts.find((amount) => amount.id === id);

                if (!alreadyIncluded) {
                    const preparedNewItem: EnergyAmounts<Id> = {
                        id,
                        amount: parseInt(
                            items.find((item) => item.id === id).energy.replace(/,/g, '')
                        ).toString()
                    };
                    newItems.push(preparedNewItem);
                }
            });
            setEnergyAmounts([...energyAmounts, ...newItems]);
        }
        if (ids.length < energyAmounts.length) {
            energyAmounts.forEach((amount) => {
                const itemStillExists = ids.includes(amount.id);
                if (!itemStillExists) {
                    const filteredAmounts = energyAmounts.filter(
                        (stateAmount) => stateAmount.id !== amount.id
                    );
                    setEnergyAmounts(filteredAmounts);
                }
            });
        }
    };

    useEffect(() => {
        addOrRemoveEnergyOnCheck(selectedIds, selectedItems);
    }, [selectedIds]);

    const handleItemEnergyAmountChange = (id: Id, amount: string) => {
        const newAmounts = energyAmounts.map((stateAmount) => {
            if (stateAmount.id === id) {
                return {
                    id,
                    amount
                };
            }
            return stateAmount;
        });
        setEnergyAmounts(newAmounts);
    };

    const handleSubmit = async () => {
        await Promise.all(
            energyAmounts.map(async (item) => {
                await submitHandler(item.id, item.amount);
            })
        );
    };

    const getEnergyAmountForItem = (id: Id) => {
        return energyAmounts.find((stateAmount) => stateAmount.id === id)?.amount;
    };

    const selectCertificateText = 'Select Certificate';
    const totalVolumeText = 'Total Volume';
    const bulkActionsRestrictionsText =
        'Bulk certificate actions are currently unavailable. Please, select single certificate to continue';
    const totalVolume = energyAmounts.reduce(
        (total, current) => (total += parseInt(current.amount)),
        0
    );
    const loadingText = 'Transaction in progress';

    useEffect(() => {
        if (setTotalAmount) {
            setTotalAmount(totalVolume);
        }
    }, [totalVolume]);

    return {
        editMode,
        setEditMode,
        selectCertificateText,
        totalVolumeText,
        totalVolume,
        getEnergyAmountForItem,
        handleItemEnergyAmountChange,
        handleSubmit,
        bulkActionsRestrictionsText,
        loading: txPending,
        loadingText
    };
};
