import { IconText, IconTextProps } from '@energyweb/origin-ui-core';
import { useTheme } from '@mui/material';
import { FC } from 'react';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { useStyles } from './MyDeviceGroupCardContent.styles';

export interface MyDeviceGroupCardContentProps {
    deviceGroupId: DeviceDTO['id'];
    iconsProps: IconTextProps[];
}

export const MyDeviceGroupCardContent: FC<MyDeviceGroupCardContentProps> = ({
    deviceGroupId,
    iconsProps
}) => {
    const classes = useStyles();
    const theme = useTheme();

    return (
        <div className={classes.contentWrapper}>
            {iconsProps.map((field) => (
                <div className={classes.iconWrapper} key={field.title + deviceGroupId}>
                    <IconText
                        iconProps={{
                            className: classes.deviceGroupIcon,
                            width: 40,
                            height: 40
                        }}
                        gridContainerProps={{
                            justifyContent: 'flex-start'
                        }}
                        {...field}
                    />
                </div>
            ))}
        </div>
    );
};
