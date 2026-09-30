import { useLocalSession } from "@/lib/LocalSessionContext";
import { localClient } from "@/api/localClient";

export const ROLE_LABELS = { citizen: "Citizen Demo", surveyor: "Surveyor Demo", government: "Government Demo" };
export const ROLE_TITLES = { citizen: "Citizen / Property Owner", surveyor: "Surveyor / Verifier", government: "Government Administrator" };

export function useRole() {
  const { user } = useLocalSession();
  const role = user?.demo_role || "citizen";
  const setRole = async (r, redirect) => {
    localClient.session.updateUser({ demo_role: r });
    window.location.href = redirect || window.location.pathname;
  };
  return {
    user,
    role,
    label: ROLE_LABELS[role],
    isGov: role === "government",
    canVerify: role !== "citizen",
    setRole,
  };
}