import * as premierepro from "./premierepro"; 
import { uxp } from "../globals";
import * as uxpLib from "./uxp";

const hostName =
  uxp?.host?.name.toLowerCase().replace(/\s/g, "") || ("" as string);

// prettier-ignore
let host = {} as 
  & typeof premierepro 

export type API = typeof host & typeof uxpLib;

if (hostName.startsWith("premierepro")) host = premierepro; 

export const api = { ...uxpLib, ...host };
