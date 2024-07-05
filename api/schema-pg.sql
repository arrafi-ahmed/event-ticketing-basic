CREATE TABLE role
(
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL -- 'sudo', 'admin', 'attendee'
);

CREATE TABLE club
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    logo        VARCHAR(255)
);

CREATE TABLE app_user
(
    id       SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(255),
    role     INT          NOT NULL REFERENCES role (id),
    club_id  INT REFERENCES club (id) ON DELETE CASCADE
);

ALTER TABLE club
    ADD COLUMN created_by INT REFERENCES app_user (id);

CREATE TABLE event
(
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    description        TEXT,
    location           VARCHAR(255) NOT NULL,
    max_attendees      INT,
    registration_count INT,
    start_date         date         NOT NULL,
    end_date           date         NOT NULL,
    banner             VARCHAR(255),
    club_id            INT          NOT NULL REFERENCES club (id) ON DELETE CASCADE,
    created_by         INT          NOT NULL REFERENCES app_user (id)
);

CREATE TABLE registration
(
    id                SERIAL PRIMARY KEY,
    registration_data jsonb,
    registration_time TIMESTAMP,
    qr_uuid           VARCHAR(255) UNIQUE NOT NULL,
    event_id          INT                 NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    club_id           INT                 NOT NULL REFERENCES club (id) ON DELETE CASCADE
);

CREATE TABLE checkin
(
    id              SERIAL PRIMARY KEY,
    checkin_status  BOOLEAN,
    checkin_time    TIMESTAMP,
    registration_id INT NOT NULL REFERENCES registration (id) ON DELETE CASCADE,
    checkedin_by    INT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE
);

INSERT INTO role (name)
VALUES ('sudo'),
       ('admin'),
       ('attendee')