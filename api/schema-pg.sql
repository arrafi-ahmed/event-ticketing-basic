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
    ticket_price       INT DEFAULT 0, -- added
    max_attendees      INT,
    registration_count INT,
    start_date         date         NOT NULL,
    end_date           date         NOT NULL,
    banner             VARCHAR(255),
    club_id            INT          NOT NULL REFERENCES club (id) ON DELETE CASCADE,
    created_by         INT          NOT NULL REFERENCES app_user (id)
);
-- added
CREATE TABLE stripe_product
(
    id         SERIAL PRIMARY KEY,
    event_id   INT          NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    price_id   VARCHAR(255) NOT NULL
);

CREATE TABLE registration
(
    id                SERIAL PRIMARY KEY,
    registration_data jsonb,   --name, email, phone, others:{...rest}
    registration_time TIMESTAMP,
    status            BOOLEAN, -- added
    qr_uuid           VARCHAR(255) UNIQUE NOT NULL,
    event_id          INT                 NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    club_id           INT                 NOT NULL REFERENCES club (id) ON DELETE CASCADE
);

--added
CREATE TABLE form_question
(
    id       SERIAL PRIMARY KEY,
    type_id  SMALLINT NOT NULL,
    text     TEXT     NOT NULL,
    required BOOLEAN  NOT NULL,
    options  jsonb,
    event_id INTEGER REFERENCES event ON DELETE CASCADE
);

CREATE TABLE checkin
(
    id              SERIAL PRIMARY KEY,
    status          BOOLEAN, -- updated
    checkin_time    TIMESTAMP,
    registration_id INT NOT NULL REFERENCES registration (id) ON DELETE CASCADE,
    checkedin_by    INT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE
);

INSERT INTO role (name)
VALUES ('sudo'),
       ('admin'),
       ('attendee')