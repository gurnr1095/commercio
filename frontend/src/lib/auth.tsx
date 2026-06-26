import { createContext, useContext } from "react";

export type GetTokenFn = () => Promise<string | null>;

const noop: GetTokenFn = () => Promise.resolve(null);

export const TokenContext = createContext<GetTokenFn>(noop);

export function useGetToken(): GetTokenFn {
  return useContext(TokenContext);
}
