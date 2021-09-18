import { FC } from 'react';
import { Button, CircularProgress, Grid, TextField, Typography } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import { IconPopover, IconSize } from '@energyweb/origin-ui-core';
import { useOrganizationBlockchainAddressEffects } from './OrganizationBlockchainAddress.effects';
import { useStyles } from './OrganizationBlockchainAddress.styles';

export const OrganizationBlockchainAddress: FC = () => {
    const classes = useStyles();
    const {
        isOperatorApproved,
        approveOperatorHandler,
        submitHandler,
        isLoading,
        blockchainAddress,
        isUpdating,
        title,
        buttonText,
        operatorApprovalButtonText,
        popoverText,
        operatorApprovalPopoverText
    } = useOrganizationBlockchainAddressEffects();

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Grid item xs={12}>
            <Typography variant="h6">{title}</Typography>
            <div className={classes.fieldWrapper}>
                {blockchainAddress ? (
                    <TextField
                        value={blockchainAddress}
                        disabled={true}
                        variant="filled"
                        className={classes.field}
                    />
                ) : (
                    <>
                        <Button
                            type="button"
                            variant="contained"
                            color="primary"
                            disabled={isUpdating}
                            onClick={submitHandler}
                        >
                            {buttonText}
                        </Button>
                        {isUpdating && <CircularProgress className={classes.loader} />}
                    </>
                )}
                <IconPopover
                    icon={Info}
                    iconSize={IconSize.Large}
                    popoverText={popoverText}
                    className={classes.iconPopover}
                />
            </div>
            {blockchainAddress && isOperatorApproved !== undefined ? (
                <div className={classes.fieldWrapper}>
                    {isOperatorApproved ? (
                        <Typography>Operator is approved!</Typography>
                    ) : (
                        <Button
                            type="button"
                            variant="contained"
                            color="primary"
                            disabled={isUpdating}
                            onClick={approveOperatorHandler}
                        >
                            {operatorApprovalButtonText}
                        </Button>
                    )}
                    <IconPopover
                        icon={Info}
                        iconSize={IconSize.Large}
                        popoverText={operatorApprovalPopoverText}
                        className={classes.iconPopover}
                    />
                </div>
            ) : (
                ''
            )}
        </Grid>
    );
};
