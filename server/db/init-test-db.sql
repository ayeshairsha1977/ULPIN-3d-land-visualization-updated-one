-- Separate database for the integration test suite.
CREATE DATABASE ulpin_test OWNER ulpin;
\connect ulpin_test
CREATE EXTENSION IF NOT EXISTS postgis;
