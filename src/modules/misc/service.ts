import { others } from "../../types/services";

/**
 * Ping server
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const ping = (): others.Response => ({
  status: true,
  message: "TraceEx to the moon!",
});
