export type AnyJSON =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSONObject
  | JSONArray;
export interface JSONObject {
  [key: string]: AnyJSON;
}
export interface JSONArray extends Array<AnyJSON> {}
