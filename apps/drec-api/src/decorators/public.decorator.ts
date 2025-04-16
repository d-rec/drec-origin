import 'reflect-metadata';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return (target: any, key?: string | symbol, descriptor?: any) => {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
    return descriptor;
  };
};
