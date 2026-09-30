-- Initial schema for the ULPIN 3D prototype backend.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE CHECK (email = lower(email)),
  full_name     text NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('citizen', 'surveyor', 'government')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Only a SHA-256 of the session token is stored, so a database leak does not leak sessions.
CREATE TABLE sessions (
  token_hash  text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

CREATE TABLE properties (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  geom        geometry(Polygon, 4326) NOT NULL CHECK (ST_IsValid(geom)),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_geom_idx ON properties USING gist(geom);

CREATE TABLE property_status (
  property_id          text PRIMARY KEY REFERENCES properties(id),
  ulpin                text UNIQUE,
  ulpin_status         text NOT NULL DEFAULT 'Not Requested',
  verification_status  text NOT NULL DEFAULT 'Pending Verification'
    CHECK (verification_status IN ('Pending Verification', 'Verified', 'Correction Required', 'Verification Revoked', 'Verification Removed')),
  revocation           jsonb,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES users(id),
  original_name text NOT NULL CHECK (length(original_name) BETWEEN 1 AND 255),
  media_type    text NOT NULL CHECK (media_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes    integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  sha256        text NOT NULL,
  is_public     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE application_number_seq;
CREATE SEQUENCE complaint_number_seq;
CREATE SEQUENCE demo_ulpin_seq;

CREATE TABLE applications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number  text NOT NULL UNIQUE,
  created_by_id       uuid NOT NULL REFERENCES users(id),
  property_id         text REFERENCES properties(id),
  status              text NOT NULL CHECK (status IN (
    'Submitted', 'Under GIS Validation', 'Under Verification', 'Correction Required',
    'Surveyor Review Complete', 'Rejected', 'ULPIN Assigned')),
  latitude            double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude           double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  details             jsonb NOT NULL,
  documents           jsonb NOT NULL DEFAULT '[]',
  checklist           jsonb NOT NULL DEFAULT '{}',
  gis_check           jsonb,
  surveyor_review     jsonb,
  ai_extractions      jsonb NOT NULL DEFAULT '[]',
  remarks             text NOT NULL DEFAULT '',
  demo_ulpin          text UNIQUE,
  history             jsonb NOT NULL DEFAULT '[]',
  submitted_at        timestamptz NOT NULL DEFAULT now(),
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX applications_owner_idx ON applications(created_by_id);
CREATE INDEX applications_property_idx ON applications(property_id);

-- Each AI extraction the server ran, so a recorded review can only reference real model output.
CREATE TABLE ai_extraction_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_label  text NOT NULL,
  result          jsonb NOT NULL,
  created_by_id   uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE complaints (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number  text NOT NULL UNIQUE,
  created_by_id     uuid NOT NULL REFERENCES users(id),
  property_id       text NOT NULL REFERENCES properties(id),
  status            text NOT NULL CHECK (status IN (
    'Submitted', 'Under Government Review', 'Complaint Valid / Confirmed', 'Complaint Rejected',
    'Under Review', 'Field Verification', 'Action Required', 'Resolved', 'Closed')),
  priority          text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  category          text NOT NULL,
  description       text NOT NULL CHECK (length(description) BETWEEN 10 AND 4000),
  details           jsonb NOT NULL DEFAULT '{}',
  evidence          jsonb NOT NULL DEFAULT '[]',
  assigned_officer  text,
  review            jsonb,
  history           jsonb NOT NULL DEFAULT '[]',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaints_owner_idx ON complaints(created_by_id);
CREATE INDEX complaints_property_idx ON complaints(property_id);

CREATE TABLE verifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     text NOT NULL REFERENCES properties(id),
  status          text NOT NULL,
  reviewer_id     uuid REFERENCES users(id),
  reviewer_name   text NOT NULL,
  reviewer_role   text NOT NULL,
  remarks         text NOT NULL DEFAULT '',
  removal_reason  text,
  checklist       jsonb NOT NULL DEFAULT '{}',
  complaint_id    uuid REFERENCES complaints(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verifications_property_idx ON verifications(property_id);

CREATE TABLE property_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  text NOT NULL REFERENCES properties(id),
  event        text NOT NULL,
  description  text NOT NULL,
  event_date   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX property_history_property_idx ON property_history(property_id);

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL,
  link        text,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications(user_id);

CREATE TABLE property_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     text NOT NULL UNIQUE REFERENCES properties(id),
  file_id         uuid NOT NULL REFERENCES files(id),
  uploaded_by_id  uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Append-only audit trail. Identity and time come from the server session, never the client.
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES users(id),
  actor_role  text,
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text,
  details     jsonb NOT NULL DEFAULT '{}',
  at          timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION audit_log_is_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_is_append_only();
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_is_append_only();
