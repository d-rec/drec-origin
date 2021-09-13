import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { useEffect, useState } from 'react';

export const useDeviceFirstImageUrl = (imageIds: DeviceDTO['images']) => {
    const [imageUrl, setImageUrl] = useState('');

    const getAndSetImage = async (id: string) => {
        const imageUrl = `${process.env.REACT_APP_BACKEND_URL}/api/file/public/${id}`;
        setImageUrl(imageUrl);
    };

    useEffect(() => {
        if (imageIds?.length > 0) {
            getAndSetImage(imageIds[0]);
        }
    }, [imageIds]);

    return imageUrl;
};
