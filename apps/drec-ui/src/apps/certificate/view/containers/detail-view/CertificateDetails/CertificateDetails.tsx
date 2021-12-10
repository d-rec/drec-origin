import { Grid, Paper, Typography } from '@mui/material';
import React, { FC } from 'react';
import { DetailedCertificate } from '../../../../types';
import { StyledTitleAndText } from '../StyledTitleAndText';
import { useCertificateDetailsEffects } from './CertificateDetails.effects';
import { useStyles } from './CertificateDetails.styles';

export interface CertificateDetailsProps {
    certificate: DetailedCertificate;
}

export const CertificateDetails: FC<CertificateDetailsProps> = ({ certificate }) => {
    const classes = useStyles();
    const {
        certificateId,
        claimed,
        creationDate,
        generationStartDate,
        generationEndDate,
        claimedEnergy,
        remainingEnergy,
        claimBeneficiaries
    } = useCertificateDetailsEffects(certificate);

    return (
        <>
            <Paper className={classes.paper}>
                <Grid container>
                    <Grid item md={4} xs={12}>
                        <StyledTitleAndText {...certificateId} />
                        {certificate.blockchainPart.isClaimed && (
                            <StyledTitleAndText {...claimedEnergy} />
                        )}
                    </Grid>
                    <Grid item md={4} xs={12}>
                        <StyledTitleAndText {...claimed} />
                        <StyledTitleAndText {...creationDate} />
                        {certificate.blockchainPart.isClaimed && (
                            <StyledTitleAndText {...remainingEnergy} />
                        )}
                    </Grid>
                    <Grid item md={4} xs={12}>
                        <StyledTitleAndText {...generationStartDate} />
                        <StyledTitleAndText {...generationEndDate} />
                        {certificate.blockchainPart.isClaimed && (
                            <div className={classes.blockItem}>
                                <Typography color="textSecondary" margin="normal">
                                    {claimBeneficiaries?.title}
                                </Typography>
                                <ol className={classes.beneficiariesList}>
                                    {claimBeneficiaries?.listItems?.map((item) => (
                                        <li key={item}>
                                            <Typography>{item}</Typography>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </>
    );
};
