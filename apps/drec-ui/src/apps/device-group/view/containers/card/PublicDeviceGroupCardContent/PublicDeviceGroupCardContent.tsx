import { SpecField, SpecFieldProps, IconTextProps, IconText } from '@energyweb/origin-ui-core';
import { Divider } from '@mui/material';
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
                        valueProps={{ className: classes.specFieldValue }}
                        {...spec}
                    />
                ))}
            </div>
            <Divider />
            <div className={classes.contentWrapper}>
                {iconsData.map((field) => (
                    <div className={classes.iconWrapper} key={field.title + id}>
                        <IconText
                            iconProps={{
                                className: classes.icon,
                                width: 25,
                                height: 25
                            }}
                            gridContainerProps={{
                                justifyContent: 'flex-start'
                            }}
                            {...field}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};
