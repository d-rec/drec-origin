import { DeviceDTO } from '@energyweb/origin-drec-api-client/dist/js/src';
import { useEffect, useState } from 'react';

export const useDeviceImageUrls = (imageIds: DeviceDTO['images']) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const getImageUrl = async (id: string) => {
        const imageUrl = `${process.env.REACT_APP_BACKEND_URL}/api/file/public/${id}`;
        return imageUrl;
    };

    const getAndSetAllImages = async (imageIds: string[]) => {
        const receivedUrls = await Promise.all(imageIds.map(async (id) => await getImageUrl(id)));
        setImageUrls(receivedUrls);
    };

    useEffect(() => {
        if (imageIds?.length > 0) {
            getAndSetAllImages(imageIds);
        }
    }, [imageIds]);

    return imageUrls;
};
