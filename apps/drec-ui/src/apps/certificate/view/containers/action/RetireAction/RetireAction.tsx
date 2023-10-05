import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import { ListActionComponentProps, FormDatePicker, FormInput,FormSelect } from '@energyweb/origin-ui-core';
import { CircularProgress, Grid, Box } from '@mui/material';
import { isEmpty } from 'lodash';
import React, { PropsWithChildren, ReactElement } from 'react';
import { withMetamask } from 'utils';
import { CertificateActionContent } from '../../list';
import { useRetireActionEffects } from './RetireAction.effects';
import { useStyles } from './RetireAction.styles';

type RetireActionProps = ListActionComponentProps<CertificateDTO['id']>;

export type TRetireAction = (props: PropsWithChildren<RetireActionProps>) => ReactElement;

const Component: TRetireAction = ({ selectedIds, resetIds }) => {
    const classes = useStyles();
    const {
        title,
        buttonText,
        selectedItems,
        retireHandler,
        isLoading,
        buttonDisabled,
        fields,
        register,
        control,
        errors
    } = useRetireActionEffects(selectedIds, resetIds);

    if (isLoading) return <CircularProgress />;

    return (
        <CertificateActionContent
            title={title}
            buttonText={buttonText}
            selectedIds={selectedIds}
            selectedItems={selectedItems}
            submitHandler={retireHandler}
            buttonDisabled={buttonDisabled}
        >
            <Grid container spacing={1} className={classes.mb}>
                <Grid item xs={6}>
                <FormInput
                    register={register}
                    field={fields[0]}
                    errorExists={!isEmpty(errors[fields[0].name])}
                    errorText={(errors[fields[0].name] as any)?.message ?? ''}
                />
                </Grid>
                <Grid item xs={6}>
                <FormInput
                    register={register}
                    field={fields[1]}
                    errorExists={!isEmpty(errors[fields[1].name])}
                    errorText={(errors[fields[1].name] as any)?.message ?? ''}
                />
                </Grid>

                <Grid item xs={6}>
                <FormSelect
                    control={control}
                    register={register}
                    field={fields[2]}
                    errorExists={!isEmpty(errors[fields[2].name])}
                    errorText={(errors[fields[2].name] as any)?.message ?? ''}
                />
                </Grid>
            </Grid>
            <Grid container spacing={1} className={classes.mb}>
                <Grid item xs={6}>
                    <FormDatePicker
                        control={control}
                        field={fields[3]}
                        errorExists={!isEmpty(errors[fields[3].name])}
                        errorText={(errors[fields[3].name] as any)?.message ?? ''}
                    />
                </Grid>
                <Grid item xs={6}>
                    <FormDatePicker
                        control={control}
                        field={fields[4]}
                        errorExists={!isEmpty(errors[fields[4].name])}
                        errorText={(errors[fields[4].name] as any)?.message ?? ''}
                    />
                </Grid>
            </Grid>
            <Box mb={2}>
                <FormInput
                    register={register}
                    field={fields[5]}
                    errorExists={!isEmpty(errors[fields[5].name])}
                    errorText={(errors[fields[5].name] as any)?.message ?? ''}
                />
            </Box>
        </CertificateActionContent>
    );

    
};
export const RetireAction = withMetamask(Component);
