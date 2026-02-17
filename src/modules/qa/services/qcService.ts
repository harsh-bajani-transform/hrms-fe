import api from "../../../services/api";
import { log, logError } from "../../../config/environment";

export interface TempQCPayload {
  user_id: string | number;
  date: string;
  assigned_hours?: number;
  qc_score?: number;
}

/**
 * Saves temporary QC data for an agent on a specific date.
 * Interacts with /qc/temp-qc endpoint.
 */
export const saveTempQC = async (payload: TempQCPayload) => {
  try {
    log(
      `[QC Service] Saving temp QC for user ${payload.user_id} on ${payload.date}`,
    );
    const response = await api.post("/qc/temp-qc", payload);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error saving temp QC:", error);
    throw error;
  }
};
