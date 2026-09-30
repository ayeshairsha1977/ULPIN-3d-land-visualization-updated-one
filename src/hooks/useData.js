import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listRecords } from "@/api/apiClient";
import { useSession } from "@/lib/SessionContext";

// These record types are only returned to signed-in users (the API enforces it too).
const PRIVATE_ENTITIES = new Set(["ULPINApplication", "Complaint", "Notification"]);

export function useEntityList(entity, query, { enabled = true } = {}) {
  const { user } = useSession();
  return useQuery({
    queryKey: [entity, query || "all", user?.id || "guest"],
    enabled: enabled && (Boolean(user) || !PRIVATE_ENTITIES.has(entity)),
    queryFn: () => listRecords(entity, query),
  });
}

export function useStatuses() {
  const q = useEntityList("PropertyStatus");
  const get = (pid) => {
    const row = (q.data || []).find((r) => r.property_id === pid);
    return {
      ulpin: row?.ulpin || "",
      ulpin_status: row?.ulpin_status || "Not Requested",
      verification_status: row?.verification_status || "Pending Verification",
    };
  };
  return { ...q, get };
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...entities) => entities.forEach((e) => qc.invalidateQueries({ queryKey: [e] }));
}