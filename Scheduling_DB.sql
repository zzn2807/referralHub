DROP DATABASE IF EXISTS SCHEDULING_DB;
CREATE DATABASE IF NOT EXISTS SCHEDULING_DB;

CREATE TABLE SCHEDULING_DB.therapists (
	id int PRIMARY KEY AUTO_INCREMENT,
    first_name varchar(255),
    last_name varchar(255),
    email varchar(255) DEFAULT NULL,
    phone char(10) DEFAULT NULL,
    service varchar(255)
);

CREATE TABLE SCHEDULING_DB.therapist_schedule (
	therapist_id int,
    app_date date,
    start_time time,
    end_time time,
    booked bool DEFAULT 0,
    client_first_name varchar(255) DEFAULT NULL,
    client_last_name varchar(255) DEFAULT NULL,
    FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

INSERT INTO SCHEDULING_DB.therapists 
(first_name, last_name, email, phone,service)
VALUES	('Jane','Doe','janedoe@hopehealthsystems.com','5555555555','Individual Therapy'),
		('John','Doe', 'johndoe@hopehealthsystems.com','1111111111', 'Individual Therapy');
        
INSERT INTO SCHEDULING_DB.therapist_schedule 
(therapist_id, app_date, start_time, end_time)
VALUES	(1,'2025-05-16','09:00:00','10:00:00'),
		(1,'2025-05-16','10:00:00','11:00:00'),
        (1,'2025-05-16','11:00:00','12:00:00'),
        (1,'2025-05-16','12:00:00','13:00:00'),
        (1,'2025-05-16','13:00:00','14:00:00'),
        (1,'2025-05-16','14:00:00','15:00:00'),
        (1,'2025-05-16','15:00:00','16:00:00'),
        (1,'2025-05-16','16:00:00','17:00:00'),
        (2,'2025-05-16','09:00:00','10:00:00'),
		(2,'2025-05-16','10:00:00','11:00:00'),
        (2,'2025-05-16','11:00:00','12:00:00'),
        (2,'2025-05-16','12:00:00','13:00:00'),
        (2,'2025-05-16','13:00:00','14:00:00'),
        (2,'2025-05-16','14:00:00','15:00:00'),
        (2,'2025-05-16','15:00:00','16:00:00'),
        (2,'2025-05-16','16:00:00','17:00:00');