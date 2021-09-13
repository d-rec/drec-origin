import { ChangeEvent, useState, useEffect } from 'react';

export const useSelectedItemEffects = <Id>(
    id: Id,
    editMode: boolean,
    setEditMode: (newValue: boolean) => void,
    amount: string,
    onAmountChange: (id: Id, amount: string) => void
) => {
    const [inputValue, setInputValue] = useState(amount);

    const openEditMode = () => {
        setEditMode(true);
    };

    const closeEditMode = () => {
        setEditMode(false);
    };

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSave = () => {
        onAmountChange(id, inputValue);
        closeEditMode();
    };

    useEffect(() => {
        if (amount !== inputValue) {
            setInputValue(amount);
        }
    }, [amount]);

    const saveText = 'Save';
    const cancelText = 'Cancel';
    const editInputLabel = 'Edit amount';

    const buttonDisabled =
        inputValue === amount ||
        isNaN(Number(inputValue)) ||
        !inputValue ||
        Number(inputValue) < 1 ||
        Number(inputValue) > Number(amount);

    return {
        editMode,
        inputValue,
        handleInputChange,
        openEditMode,
        closeEditMode,
        handleSave,
        saveText,
        cancelText,
        editInputLabel,
        buttonDisabled
    };
};
