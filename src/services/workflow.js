// Client-side calls for workflow actions. Every rule (who may do what, in which order)
// is enforced by the server in server/services/; these functions only send requests.
import { api } from "@/api/apiClient";

/* ---------------- ULPIN applications ---------------- */
export const submitApplication = (form) => api.post("/api/applications", form);

export const reviewApplication = (appId, status, note, checklist) =>
  api.post(`/api/applications/${appId}/review`, { status, note, checklist });

export const runAiExtraction = (appId, documentLabel) =>
  api.post(`/api/applications/${appId}/ai-extract`, { document_label: documentLabel });

export const recordAiExtractionReview = (appId, runId, note) =>
  api.post(`/api/applications/${appId}/ai-review`, { run_id: runId, note });

/* ---------------- Complaints ---------------- */
export const submitComplaint = (form) => api.post("/api/complaints", form);
export const assignComplaint = (id, officer) => api.post(`/api/complaints/${id}/assign`, { officer });
export const setComplaintPriority = (id, priority) => api.post(`/api/complaints/${id}/priority`, { priority });
export const updateComplaint = (id, status, note) => api.post(`/api/complaints/${id}/status`, { status, note });
export const decideComplaint = (id, decision, reason) => api.post(`/api/complaints/${id}/decision`, { decision, reason });

/* ---------------- Property verification ---------------- */
export const verifyProperty = (propertyId, status, remarks, checklist) =>
  api.post(`/api/properties/${propertyId}/verify`, { status, remarks, checklist });

export const removeVerification = (propertyId, reason, remarks) =>
  api.post(`/api/properties/${propertyId}/remove-verification`, { reason, remarks });

export const setPropertyPhoto = (propertyId, fileId) => api.put(`/api/properties/${propertyId}/photo`, { file_id: fileId });
export const deletePropertyPhoto = (propertyId) => api.delete(`/api/properties/${propertyId}/photo`);

/* ---------------- Notifications ---------------- */
export const markNotificationsRead = () => api.post("/api/notifications/read-all");
