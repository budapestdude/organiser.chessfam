-- Delete all tournaments
DELETE FROM tournaments;

-- Delete all clubs
DELETE FROM clubs;

-- Reset sequences
ALTER SEQUENCE tournaments_id_seq RESTART WITH 1;
ALTER SEQUENCE clubs_id_seq RESTART WITH 1;
