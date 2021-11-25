import { CircularProgress } from '@mui/material';
import { CertificateDetails, DeviceGroupDetails } from '../../containers';
import { useDetailedPageViewEffects } from './DetailViewPage.effects';
import { useStyles } from './DetailViewPage.styles';

export const DetailViewPage = () => {
    const { certificate, deviceGroup, isLoading } = useDetailedPageViewEffects();
    const classes = useStyles();

    if (isLoading) return <CircularProgress />;

    return (
        <div className={classes.wrapper}>
            <CertificateDetails certificate={certificate} />
            <DeviceGroupDetails deviceGroup={deviceGroup} />
        </div>
    );
};
