/** Public assets follow the deployment base, including GitHub project Pages. */
export const assetUrl = (url: string) => `${import.meta.env?.BASE_URL ?? '/'}${url.replace(/^\/+/, '')}`;
