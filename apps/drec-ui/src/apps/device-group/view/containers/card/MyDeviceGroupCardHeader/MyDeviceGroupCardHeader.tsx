import { SpecField, SpecFieldProps } from '@energyweb/origin-ui-core';
import { Button, IconButton, Typography, Divider } from '@material-ui/core';
import { ChevronRight, Delete } from '@material-ui/icons';
import React from 'react';
import { useMyDeviceGroupCardHeaderEffects } from './MyDeviceGroupCardHeader.effects';
import { useStyles } from './MyDeviceGroupCardHeader.styles';

interface MyDeviceGroupCardHeaderProps {
    deviceGroupId: number;
    deviceGroupName: string;
    buttonText: string;
    buttonLink: string;
    groupAttributes: SpecFieldProps[][];
    specFieldProps: SpecFieldProps[];
}

export const MyDeviceGroupCardHeader: React.FC<MyDeviceGroupCardHeaderProps> = ({
    deviceGroupId,
    deviceGroupName,
    buttonText,
    buttonLink,
    groupAttributes,
    specFieldProps
}) => {
    const classes = useStyles();

    const { clickHandler, deleteHandler } = useMyDeviceGroupCardHeaderEffects(
        buttonLink,
        deviceGroupId
    );

    return (
        <div className={classes.headerWrapper}>
            <div className={classes.nameBlockWrapper}>
                <Typography sx={{ display: { xs: 'none', lg: 'block', xl: 'block' } }} variant="h5">
                    {deviceGroupName}
                </Typography>
                <div className={classes.buttonsWrapper}>
                    <Button
                        color="inherit"
                        onClick={clickHandler}
                        className={classes.button}
                        classes={{ endIcon: classes.buttonEndIcon }}
                        endIcon={<ChevronRight fontSize="small" />}
                    >
                        {buttonText}
                    </Button>
                    <IconButton color="primary" size="large" onClick={deleteHandler}>
                        <Delete fontSize="inherit" />
                    </IconButton>
                </div>
            </div>
            <div className={classes.attributesBlockWrapper}>
                {groupAttributes.map((attributes, i) => (
                    <div
                        key={`group-attributes-${attributes[0].label}-${attributes[0].value}-${attributes[1]?.value}`}
                        style={{ width: '100%' }}
                    >
                        <div className={classes.attributeSpecBlockWrapper}>
                            {attributes.map((specAttribute, j) => (
                                <div
                                    key={`spec-attribute-${specAttribute.label}`}
                                    style={{ width: '100%' }}
                                >
                                    <SpecField
                                        wrapperProps={{ className: classes.specFieldWrapper }}
                                        valueProps={{ className: classes.specFieldValue }}
                                        {...specAttribute}
                                    />
                                    {j < attributes.length - 1 ? (
                                        <Divider
                                            sx={{ display: { md: 'block', lg: 'none' } }}
                                            className={classes.divider}
                                        />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                        <Divider className={classes.divider} />
                    </div>
                ))}
            </div>
            <div className={classes.specBlockWrapper}>
                {specFieldProps.map((specProp, index) => (
                    <div key={`spec-field-${specProp.label}`} style={{ width: '100%' }}>
                        <SpecField
                            wrapperProps={{ className: classes.specFieldWrapper }}
                            valueProps={{ className: classes.specFieldValue }}
                            {...specProp}
                        />
                        {index < specFieldProps.length - 1 ? (
                            <Divider className={classes.divider} />
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
};
