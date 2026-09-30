import { useQuery, useQueryClient } from "@tanstack/react-query";
import { localClient } from "@/api/localClient";

export function useEntityList(entity, query, { enabled = true } = {}) {
  return useQuery({
    queryKey: [entity, query || "all"],
    enabled,
    queryFn: () =>
      query
        ? localClient.entities[entity].filter(query, "-created_date", 200)
        : localClient.entities[entity].list("-created_date", 200),
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