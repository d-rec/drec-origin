export const waitForState = async (
    requestedStateChecker: () => Promise<boolean>,
    errorMessage: string,
    {
        interval = 5_000,
        maxTries = 12,
        delay = 0
    }: { maxTries?: number; interval?: number; delay?: number } = {}
): Promise<string> => {
    let currentTries = 0;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return await new Promise<any>((resolve, reject) => {
        const checkInterval = setInterval(async () => {
            if (currentTries > maxTries) {
                clearInterval(checkInterval);
                reject(new Error(errorMessage));
            }

            const hasRequestedState = await requestedStateChecker();
            if (hasRequestedState) {
                clearInterval(checkInterval);
                resolve(true);
            } else {
                currentTries++;
            }
        }, interval);
    });
};
