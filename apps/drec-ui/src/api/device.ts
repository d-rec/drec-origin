import {
    DeviceDTO,
    useDeviceControllerGet,
    useDeviceControllerGetAll,
    useDeviceControllerGetFuelTypes
} from '@energyweb/origin-drec-api-client';
import { publicFileDownloadHandler } from './file';
import { useEffect, useState } from 'react';

export const useApiAllDevices = () => {
    const { data: allDevices, isLoading: isOriginDevicesLoading } = useDeviceControllerGetAll();

    const isLoading = isOriginDevicesLoading;

    return { allDevices, isLoading };
};

export const useAllDeviceFuelTypes = () => {
    const { data: allTypes, isLoading } = useDeviceControllerGetFuelTypes({
        staleTime: 1000000
    });

    return { allTypes, isLoading };
};

export const useDeviceDetailData = (id: DeviceDTO['id']) => {
    const { data, isLoading: isDeviceLoading } = useDeviceControllerGet(id);
    const isLoading = isDeviceLoading;

    const device = !isLoading && data;

    return { device, isLoading };
};

export const useDeviceFirstImageUrl = (imageIds: DeviceDTO['images']) => {
    const [imageUrl, setImageUrl] = useState('');

    const getAndSetImage = async (id: string) => {
        const response = await publicFileDownloadHandler(id);
        const imageType = (response as any).headers['content-type'];
        const blob = new Blob([Buffer.from((response.data as any).data as unknown as string)], {
            type: imageType
        });
        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(blob);
        setImageUrl(imageUrl);
    };

    useEffect(() => {
        if (imageIds?.length > 0) {
            getAndSetImage(imageIds[0]);
        }
    }, [imageIds]);

    return imageUrl;
};

export const useDeviceImageUrls = (imageIds: DeviceDTO['images']) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const getImageUrl = async (id: string) => {
        const response = await publicFileDownloadHandler(id);
        const imageType = (response as any).headers['content-type'];
        const blob = new Blob([Buffer.from((response.data as any).data as unknown as string)], {
            type: imageType
        });
        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(blob);
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
