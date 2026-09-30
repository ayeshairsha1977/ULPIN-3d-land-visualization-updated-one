// Demo property dataset. Geometry, layouts and coordinates are DEMO / schematic data,
// not official cadastral or surveyed records.

export const FLOOR_HEIGHT = 3.2;

export const MRECW_PHOTO = "/property-3.jpeg";

const R = (number, name, type, x, z, w, d, extra = {}) => ({
  number, name, type, x, z, w, d, status: "Active", side: z < 0 ? "Rear" : "Front", ...extra,
});

const finalize = (pid, floors) =>
  floors.map((f) => ({
    ...f,
    rooms: f.rooms.map((r, i) => ({ ...r, id: `${pid}-${f.key}-${i}`, floorKey: f.key, floorName: f.name })),
  }));

const rect = (lat, lng, dLat, dLng) => [
  [lat + dLat, lng - dLng], [lat + dLat, lng + dLng], [lat - dLat, lng + dLng], [lat - dLat, lng - dLng],
];

const range = (n) => Array.from({ length: n }, (_, i) => i);

/* ---------- 01 · Sree Lalitha Girls Hostel 2 ---------- */
const hostelUpper = (n) => {
  const st = (i) => ((i + n) % 3 === 0 ? "Available" : "Occupied");
  return [
    R("WR", "Common Washrooms", "Washroom", -15, -6, 2.5, 12, { core: true, side: "West" }),
    ...range(5).map((i) => R(`${n}0${i + 1}`, `Room ${n}0${i + 1}`, "Hostel Room", -12.5 + i * 5, -6, 5, 5, { side: "Left", status: st(i) })),
    R("COR", "Corridor", "Corridor", -12.5, -1, 25, 2, { core: true, flat: true }),
    ...range(5).map((i) => {
      const no = `${n}${String(i + 6).padStart(2, "0")}`;
      return R(no, `Room ${no}`, "Hostel Room", -12.5 + i * 5, 1, 5, 5, { side: "Right", status: st(i + 5) });
    }),
    R("ST", "Staircase", "Staircase", 12.5, -6, 2.5, 12, { core: true, side: "East" }),
  ];
};

const hostelFloors = finalize("sree-lalitha-hostel-2", [
  { key: "G", level: 0, name: "Ground Floor", short: "Ground", summary: "Mess (dining) and entrance lobby", rooms: [
    R("ST", "Staircase", "Staircase", -15, -6, 2.5, 12, { core: true }),
    R("G01", "Mess", "Dining / Mess", -12.5, -6, 22.5, 12),
    R("LOB", "Entrance & Lobby", "Entrance", 10, -6, 5, 12, { core: true }),
  ] },
  ...[1, 2, 3, 4, 5].map((n) => ({ key: `F${n}`, level: n, name: `Floor ${n}`, short: `Floor ${n}`, summary: "10 hostel rooms: 5 left, 5 right", rooms: hostelUpper(n) })),
  { key: "T", level: 6, name: "Terrace", short: "Terrace", summary: "Terrace Rooms + Open Terrace + Staircase Headroom", rooms: [
    ...range(5).map((i) => R(`T0${i + 1}`, `Terrace Room T0${i + 1}`, "Terrace Room", -12.5 + i * 5, -6, 5, 5, { side: "Left", status: i % 2 ? "Available" : "Occupied" })),
    R("ST", "Staircase Headroom", "Staircase", 12.5, -6, 2.5, 12, { core: true, side: "East" }),
    R("OT", "Open Terrace", "Open Area", -15, -1, 27.5, 7, { core: true, flat: true, side: "West", status: "Open" }),
  ] },
]);

/* ---------- 02 · SARZA Fast Food & Juices + Hostel ---------- */
const sarzaUpper = (n) => [
  ...range(4).map((i) => R(`${n}0${i + 1}`, `Room ${n}0${i + 1}`, "Hostel Room", -10 + i * 4.25, -5, 4.25, 4, { side: "Left", status: (i + n) % 2 ? "Occupied" : "Available" })),
  R("COR", "Corridor", "Corridor", -10, -1, 17, 2, { core: true, flat: true }),
  ...range(4).map((i) => R(`${n}0${i + 5}`, `Room ${n}0${i + 5}`, "Hostel Room", -10 + i * 4.25, 1, 4.25, 4, { side: "Right", status: (i + n) % 3 ? "Occupied" : "Available" })),
  R("ST", "Staircase", "Staircase", 7, -5, 3, 10, { core: true }),
];

const sarzaFloors = finalize("sarza-fastfood-hostel", [
  { key: "B", level: -1, name: "Basement", short: "Basement", summary: "Basement / Service Area", rooms: [
    R("B01", "Basement / Service Area", "Service Area", -10, -5, 17, 10),
    R("ST", "Staircase", "Staircase", 7, -5, 3, 10, { core: true }),
  ] },
  { key: "G", level: 0, name: "Ground Floor", short: "Ground", summary: "Fast food & juice business", rooms: [
    R("G01", "Fast Food & Juice Counter", "Commercial", -10, -5, 10, 10),
    R("G02", "Customer Seating Area", "Commercial", 0, -5, 7, 10),
    R("ST", "Staircase", "Staircase", 7, -5, 3, 10, { core: true }),
  ] },
  ...[1, 2, 3].map((n) => ({ key: `F${n}`, level: n, name: `Floor ${n}`, short: `Floor ${n}`, summary: "Hostel accommodation (demo layout)", rooms: sarzaUpper(n) })),
]);

/* ---------- 03 · MRECW Block 3 ---------- */
// Layout per the provided hand-drawn floor-plan reference: stairs + lift at the
// far left, five classroom segments along a central corridor, washroom + stair
// at the far right (demo schematic geometry).
const mrecwUpper = (n) => [
  R("LS", "Left Staircase", "Staircase", -15, -6, 3, 12, { core: true, side: "West" }),
  R("LIFT", "Lift", "Lift", -12, -6, 3, 5, { core: true, side: "West" }),
  ...range(5).map((i) => R(`${n}0${i + 1}`, `Room ${n}0${i + 1}`, "Classroom", -9 + i * 3.6, -6, 3.6, 5, { side: "Rear" })),
  R("WR", "Washroom", "Washroom", 9, -6, 3, 5, { core: true, side: "East" }),
  R("COR", "Corridor", "Corridor", -12, -1, 24, 2, { core: true, flat: true }),
  ...range(5).map((i) => {
    const no = `${n}${String(i + 6).padStart(2, "0")}`;
    return R(no, `Room ${no}`, "Classroom", -12 + i * 4.8, 1, 4.8, 5, { side: "Front" });
  }),
  R("RS", "Right Staircase", "Staircase", 12, -6, 3, 12, { core: true, side: "East" }),
];

const mrecwFloors = finalize("mrecw-block-3", [
  { key: "G", level: 0, name: "Ground Floor", short: "Ground", summary: "Lab 1, Lab 2, Main Entrance, Lift, Staircases", rooms: [
    R("LS", "Left Staircase", "Staircase", -15, -6, 3, 12, { core: true, side: "West" }),
    R("G01", "Lab 1", "Laboratory", -12, -6, 9, 12, { side: "West" }),
    R("LIFT", "Lift", "Lift", -1.5, -6, 3, 4, { core: true }),
    R("ENT", "Main Entrance", "Entrance", -3, -2, 6, 8, { core: true }),
    R("G02", "Lab 2", "Laboratory", 3, -6, 9, 12, { side: "East" }),
    R("RS", "Right Staircase", "Staircase", 12, -6, 3, 12, { core: true, side: "East" }),
  ] },
  ...[1, 2, 3].map((n) => ({ key: `F${n}`, level: n, name: `Floor ${n}`, short: `Floor ${n}`, summary: "10 classrooms across five segments, central corridor, washroom, lift, staircases", rooms: mrecwUpper(n) })),
]);

const LOCATION = "Maisammaguda / Bhadurpalle, Hyderabad, Telangana";
const ADMIN = { state: "Telangana", district: "Medchal–Malkajgiri", mandal: "Dundigal Gandimaisamma", locality: "Maisammaguda" };

const DOCS = [
  { name: "Ownership Document", kind: "Ownership" },
  { name: "Approved Building Plan", kind: "Building" },
  { name: "Survey Sketch", kind: "Survey" },
  { name: "Property Tax Receipt", kind: "Tax" },
];

export const PROPERTIES = [
  {
    id: "sree-lalitha-hostel-2", code: "01", propertyCode: "PRP-DEMO-001", parcelNumber: "DEMO-PCL-0101",
    name: "Sree Lalitha Girls Hostel 2", shortName: "Sree Lalitha Hostel 2",
    type: "Residential / Hostel", category: "Residential", landUse: "Residential", buildingType: "Hostel",
    location: LOCATION, ...ADMIN, lat: 17.5578, lng: 78.4392, polygon: rect(17.5578, 78.4392, 0.00012, 0.00016),
    color: "#0F766E", floorsLabel: "G + 5 + Terrace", levels: 7, heightLabel: "≈ 22 m (schematic)",
    dims: { w: 30, d: 12 }, photo: "/property-1.jpeg",
    description: "Girls' hostel with a ground-floor mess, five residential floors of ten rooms each, and terrace rooms beside an open terrace.",
    demonstrates: "Vertical residential property mapping",
    floors: hostelFloors, documents: DOCS,
    history: [
      { year: "2024", event: "Initial Parcel Record", description: "Demo parcel record created from reference location." },
      { year: "2025", event: "Building Information Updated", description: "Floor-wise hostel room data added." },
      { year: "2026", event: "3D Model Generated", description: "Schematic 3D digital twin created (demo geometry)." },
      { year: "2026", event: "Possible Structural Change Detected", description: "Terrace rooms flagged for field confirmation (demo flag, not automated detection).", flag: true },
    ],
    analysis: [
      { title: "Building Footprint Identified", detail: "Rectangular footprint aligned with demo boundary." },
      { title: "Vertical Levels Detected", detail: "Ground + 5 floors + terrace structure." },
      { title: "Possible Structural Change", detail: "Terrace rooms may not appear in the initial record — verify on site.", flag: true },
      { title: "Property Classification", detail: "Residential / Hostel." },
    ],
  },
  {
    id: "sarza-fastfood-hostel", code: "02", propertyCode: "PRP-DEMO-002", parcelNumber: "DEMO-PCL-0102",
    name: "SARZA Fast Food & Juices + Hostel", shortName: "SARZA Fast Food & Hostel",
    type: "Mixed-use (Commercial + Residential)", category: "Mixed-use", landUse: "Mixed-use", buildingType: "Commercial + Hostel",
    location: LOCATION, ...ADMIN, lat: 17.5571, lng: 78.4418, polygon: rect(17.5571, 78.4418, 0.0001, 0.00012),
    color: "#F59E0B", floorsLabel: "B + G + 3", levels: 5, heightLabel: "≈ 13 m (schematic)",
    dims: { w: 20, d: 10 }, photo: "/property-2.jpeg", layoutNote: "Internal room layout is demo data and has not been independently verified.",
    description: "Mixed-use building: basement service area, a fast food & juice business on the ground floor, and hostel floors above.",
    demonstrates: "Mixed-use, commercial + residential, basement, vertical mapping",
    floors: sarzaFloors, documents: DOCS,
    history: [
      { year: "2024", event: "Initial Parcel Record", description: "Demo parcel record created from reference location." },
      { year: "2025", event: "Building Information Updated", description: "Commercial ground floor and hostel use recorded." },
      { year: "2026", event: "3D Model Generated", description: "Schematic 3D digital twin created (demo geometry)." },
    ],
    analysis: [
      { title: "Building Footprint Identified", detail: "Compact footprint within demo boundary." },
      { title: "Vertical Levels Detected", detail: "Basement + ground + 3 upper floors." },
      { title: "Missing Property Information", detail: "Basement use not documented — requires owner input.", flag: true },
      { title: "Property Classification", detail: "Mixed-use (commercial + residential)." },
    ],
  },
  {
    id: "mrecw-block-3", code: "03", propertyCode: "PRP-DEMO-003", parcelNumber: "DEMO-PCL-0103",
    name: "Malla Reddy Engineering College for Women – Block 3", shortName: "MRECW Block 3",
    type: "Institutional / Educational", category: "Institutional", landUse: "Educational", buildingType: "Academic Block",
    location: LOCATION, ...ADMIN, lat: 17.5602, lng: 78.441, polygon: rect(17.5602, 78.441, 0.00011, 0.00018),
    color: "#4F46E5", floorsLabel: "G + 3", levels: 4, heightLabel: "≈ 14 m (schematic)",
    dims: { w: 30, d: 12 }, photo: MRECW_PHOTO, isMrecw: true,
    description: "Academic block with two ground-floor laboratories and three floors of ten classrooms each, arranged as five segments along a central corridor, with washroom, lift and twin staircases.",
    demonstrates: "Institutional, floor-wise, classroom and laboratory mapping",
    floors: mrecwFloors, documents: DOCS,
    history: [
      { year: "2024", event: "Initial Parcel Record", description: "Demo parcel record created from reference location." },
      { year: "2025", event: "Building Information Added", description: "Labs, classrooms and circulation cores recorded." },
      { year: "2026", event: "3D Model Generated", description: "Schematic 3D digital twin created (demo geometry)." },
    ],
    analysis: [
      { title: "Building Footprint Identified", detail: "Elongated academic block footprint." },
      { title: "Vertical Levels Detected", detail: "Ground + 3 floors." },
      { title: "Parcel Boundary Analyzed", detail: "Demo boundary encloses the block footprint." },
      { title: "Property Classification", detail: "Institutional / Educational." },
    ],
  },
];

export const getProperty = (id) => PROPERTIES.find((p) => p.id === id);

export const roomCount = (p) => p.floors.reduce((n, f) => n + f.rooms.filter((r) => !r.core).length, 0);