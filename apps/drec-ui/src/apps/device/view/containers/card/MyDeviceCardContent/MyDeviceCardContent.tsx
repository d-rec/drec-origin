import { IconText, IconTextProps } from '@energyweb/origin-ui-core';
import { useTheme } from '@material-ui/core';
import { FC } from 'react';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { useStyles } from './MyDeviceCardContent.styles';

export interface MyDeviceCardContentProps {
    deviceId: DeviceDTO['id'];
    iconsProps: IconTextProps[];
}

export const MyDeviceCardContent: FC<MyDeviceCardContentProps> = ({ deviceId, iconsProps }) => {
    const classes = useStyles();
    const theme = useTheme();

    return (
        <div className={classes.contentWrapper}>
            {iconsProps.map((field) => (
                <div className={classes.iconWrapper} key={field.title + deviceId}>
                    <IconText
                        iconProps={{
                            className: classes.deviceIcon,
                            width: 40,
                            height: 40
                        }}
                        gridContainerProps={{
                            justifyContent: theme.breakpoints.up('md') ? 'center' : 'flex-start'
                        }}
                        {...field}
                    />
                </div>
            ))}
        </div>
    );
};
