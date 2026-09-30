export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export const sortByDate = (rows, dir) =>
  [...rows].sort((a, b) => {
    const d = new Date(b.created_date) - new Date(a.created_date);
    return dir === "oldest" ? -d : d;
  });

export const withAll = (label, list) => [{ value: "all", label }, ...list];

export const matches = (row, term, keys) =>
  !term || keys.some((k) => String(row[k] || "").toLowerCase().includes(term.toLowerCase()));