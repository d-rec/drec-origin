import { IRECBusinessLegalStatusLabelsMap } from '@energyweb/utils-general';

// Need to check this if we need DREC Business enum instead of IREC
export const formatOrganizationBusinessType = (businessType: string): string => {
    return IRECBusinessLegalStatusLabelsMap[
        businessType as unknown as keyof typeof IRECBusinessLegalStatusLabelsMap
    ];
};
