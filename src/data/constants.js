export const COMPLAINT_CATEGORIES = [
  "Incorrect Property Information",
  "Boundary Mismatch",
  "Possible Encroachment",
  "ULPIN Issue",
  "Incorrect 3D Building Data",
  "Missing Property / Record",
  "Other",
];

export const COMPLAINT_STATUSES = ["Submitted", "Under Government Review", "Complaint Valid / Confirmed", "Complaint Rejected", "Under Review", "Field Verification", "Action Required", "Resolved", "Closed"];
export const APP_STATUSES = ["Submitted", "Under GIS Validation", "Under Verification", "Surveyor Review Complete", "Correction Required", "Rejected", "ULPIN Assigned"];
export const VERIFICATION_STATUSES = ["Pending Verification", "Verified", "Correction Required", "Verification Revoked"];
export const ULPIN_STATUSES = ["Not Requested", "Application Submitted", "Under Verification", "Approved", "Assigned"];
export const PROPERTY_CATEGORIES = ["Residential", "Mixed-use", "Institutional"];

export const APP_STAGES = ["Application Submitted", "GIS Validation", "Document Verification", "Government Approval", "ULPIN Assigned"];
export const APP_STAGE_INDEX = {
  Submitted: 0, "Under GIS Validation": 1, "Under Verification": 2, "Surveyor Review Complete": 3, "Correction Required": 2, Rejected: 4, Approved: 3, "ULPIN Assigned": 4,
};

export const COMPLAINT_STAGES = ["Complaint Received", "Under Government Review", "Government Decision"];
export const complaintStageIndex = (c) => {
  const map = {
    Submitted: 0,
    "Under Government Review": 1,
    "Complaint Valid / Confirmed": 2,
    "Complaint Rejected": 2,
    "Under Review": 1,
    "Action Required": 1,
    "Field Verification": 1,
    Resolved: 2,
    Closed: 2,
  };
  return map[c.status] ?? 0;
};

export const ACTIVE_COMPLAINT = (c) => !["Complaint Valid / Confirmed", "Complaint Rejected", "Resolved", "Closed"].includes(c.status);
export const PENDING_APP = (a) => !["ULPIN Assigned", "Rejected"].includes(a.status);