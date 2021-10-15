import { SpecField, SpecFieldProps, IconTextProps, IconText } from '@energyweb/origin-ui-core';
import { Divider } from '@material-ui/core';
import React, { ReactElement } from 'react';
import { useStyles } from './PublicDeviceGroupCardContent.styles';

export interface PublicDeviceGroupCardContentProps<Id> {
    id: Id;
    specsData: SpecFieldProps[];
    iconsData: IconTextProps[];
}

type TPublicDeviceGroupCardContent = <Id>(
    props: PublicDeviceGroupCardContentProps<Id>
) => ReactElement;

export const PublicDeviceGroupCardContent: TPublicDeviceGroupCardContent = ({
    id,
    specsData,
    iconsData
}) => {
    const classes = useStyles();
    return (
        <>
            <div className={classes.specsWrapper}>
                {specsData.map((spec) => (
                    <SpecField
                        key={spec.label + id}
                        wrapperProps={{ className: classes.specFieldWrapper }}
                        {...spec}
                    />
                ))}
            </div>
            <Divider />
            <div>
                {iconsData.map((field) => (
                    <IconText
                        key={field.title + id}
                        iconProps={{ className: classes.icon }}
                        {...field}
                    />
                ))}
            </div>
        </>
    );
};
