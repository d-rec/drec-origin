import { IconText, IconTextProps, SpecField, SpecFieldProps } from '@energyweb/origin-ui-core';
import { Box, Card, CardContent } from '@mui/material';
import React, { FC } from 'react';
import { useStyles } from './DetailViewCard.styles';

export interface DetailViewCardProps {
    headingIconProps: IconTextProps;
    specFields: SpecFieldProps[];
    fullWidth?: boolean;
}

export const DetailViewCard: FC<DetailViewCardProps> = ({
    headingIconProps,
    specFields,
    fullWidth
}) => {
    const classes = useStyles();
    return (
        <Card className={fullWidth ? classes.fullWidthCard : classes.card}>
            <Box py={1} px={2} className={classes.heading}>
                <IconText
                    gridContainerProps={{
                        direction: 'row-reverse',
                        justifyContent: 'space-between'
                    }}
                    iconProps={{ className: classes.icon }}
                    {...headingIconProps}
                />
            </Box>
            <CardContent>
                {specFields.map((spec) => (
                    <SpecField
                        key={spec.label}
                        wrapperProps={{ className: classes.specWrapper }}
                        valueProps={{ className: classes.specValue }}
                        {...spec}
                    />
                ))}
            </CardContent>
        </Card>
    );
};
