import 'reflect-metadata';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => {
  return (target: any, key?: string | symbol, descriptor?: any) => {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
    return descriptor;
  };
};
