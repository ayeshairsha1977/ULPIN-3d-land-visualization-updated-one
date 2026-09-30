import { useSession } from "@/lib/SessionContext";

export const ROLE_LABELS = { citizen: "Citizen", surveyor: "Surveyor", government: "Government" };
export const ROLE_TITLES = { citizen: "Citizen / Property Owner", surveyor: "Surveyor / Verifier", government: "Government Administrator" };

// The role comes from the server session. The UI uses it only to show or hide things;
// the API enforces every permission itself.
export function useRole() {
  const { user } = useSession();
  const role = user?.role || null;
  return {
    user,
    role,
    label: role ? ROLE_LABELS[role] : "Guest",
    isGov: role === "government",
    canVerify: role === "surveyor" || role === "government",
  };
}
