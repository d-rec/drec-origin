import {
    SelectAutocomplete,
    FormSelectOption,
    SelectAutocompleteField
} from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { DeviceOrderBy } from '../../../../../utils';

interface SelectGroupByProps {
    itemProps: React.HTMLAttributes<HTMLDivElement>;
    field: SelectAutocompleteField<any>;
    orderItems: DeviceOrderBy[];
    handleChange: (options: FormSelectOption[]) => void;
}

export const SelectGroupBy: FC<SelectGroupByProps> = ({
    itemProps,
    field,
    orderItems,
    handleChange
}) => {
    return (
        <div {...itemProps}>
            <SelectAutocomplete
                field={field}
                variant="filled"
                value={
                    field.options.filter((option) =>
                        orderItems.includes(option.value as DeviceOrderBy)
                    ) || []
                }
                onChange={handleChange}
            />
        </div>
    );
};
