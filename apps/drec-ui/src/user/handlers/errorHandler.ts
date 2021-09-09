import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

export const userApiErrorHandler = (error: any) => {
    console.log(error);
    if (error?.data?.message) {
        showNotification(error.data.message, NotificationTypeEnum.Error);
    } else if (error?.response) {
        showNotification(error.response.data.message, NotificationTypeEnum.Error);
    } else if (error?.message) {
        showNotification(error.message, NotificationTypeEnum.Error);
    } else {
        console.warn('Unknown error', error);
        showNotification('Unknown error', NotificationTypeEnum.Error);
    }
};
