import {
    DeviceDTO,
    useDeviceControllerGet,
    useDeviceControllerGetAll,
    useDeviceControllerGetFuelTypes,
    useDeviceControllerGetMyDevices
} from '@energyweb/origin-drec-api-client';
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
    const { data: device, isLoading } = useDeviceControllerGet(id);
    return { device, isLoading };
};

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

export const useApiMyDevices = () => {
    const { data: myDevices, isLoading } = useDeviceControllerGetMyDevices();
    return { isLoading, myDevices };
};
