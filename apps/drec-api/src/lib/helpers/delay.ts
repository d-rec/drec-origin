/**
 * Creates a promise that resolves after a specified delay
 * 
 * @param ms - The delay duration in milliseconds
 * @returns Promise that resolves after the specified delay
 */
export const delay = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, ms));