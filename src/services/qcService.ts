import { qcApi } from "./api";
import api from "./api";

export interface QCResponse {
  success: boolean;
  status: number;
  data: Record<string, unknown> | Record<string, unknown>[] | unknown;
  message?: string;
}

export const generateQCSample = async (tracker_id: number | string, logged_in_user_id: number | string): Promise<QCResponse> => {
  try {
    const response = await qcApi.post("/qc-records/generate-sample", {
      tracker_id,
      logged_in_user_id
    });
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error generating sample:", message);
    throw error;
  }
};

export const saveQCRecord = async (payload: Record<string, unknown>): Promise<QCResponse> => {
  try {
    const response = await qcApi.post("/qc-records/save-qc-record", payload);
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error saving QC record:", message);
    throw error;
  }
};

export const fetchAFDList = async (): Promise<QCResponse> => {
  try {
    // AFD list is usually on the Python backend
    const response = await api.post("/qc_afd/list", {});
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching AFD list:", message);
    throw error;
  }
};
