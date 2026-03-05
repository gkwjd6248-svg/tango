-- Seoul Tango Festival 2026
INSERT INTO events (id, title, description, event_type, venue_name, address, city, country_code, latitude, longitude, start_datetime, end_datetime, price_info, currency, organizer_name, organizer_contact, website_url, source, is_verified, status, created_at, updated_at) VALUES
(gen_random_uuid(), '2026 Seoul Tango Festival', 'Opening Gala Show featuring 2025 Escenario World Champion. Maestros: Esteban & Claudia Codega, Leandro Bojko & Micaela Garcia, Ignacio Varchausky. Workshops, milongas, performances.', 'festival', 'Yeongdeungpo Art Hall', 'Yeongdeungpo Art Hall, Seoul', 'Seoul', 'KR', 37.5172, 126.9070, '2026-04-30 19:30:00+09', '2026-05-04 23:59:00+09', 'See website for pricing', 'KRW', 'El Bulin (Han Kyung-a)', '070-8095-2646 / leoyflortango@gmail.com', 'https://seoultangofestival.com/', 'manual', true, 'active', NOW(), NOW()),

-- Sunday: RUSA milonga
(gen_random_uuid(), 'RUSA Milonga - Sunday at Hongdae', 'Every Sunday regular milonga at LUZ. Popular milonga in the Hongdae area near Donggyo-ro.', 'milonga', 'LUZ 2F', '190 Donggyo-ro, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5568, 126.9237, '2026-03-01 18:30:00+09', '2026-03-01 22:30:00+09', '13,000 KRW', 'KRW', 'RUSA', 'su4550@naver.com / 010-4804-7335', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Monday: EL TANGO CAFE
(gen_random_uuid(), 'El Tango Cafe - Monday Milonga', 'Every Monday milonga at the legendary El Tango Cafe in Jamwon-dong, Seocho-gu. Open until 3am.', 'milonga', 'El Tango Cafe', 'Jamwon-dong 27-11, Seocho-gu, Seoul', 'Seoul', 'KR', 37.5110, 127.0115, '2026-03-02 20:00:00+09', '2026-03-03 03:00:00+09', '9,000 KRW', 'KRW', 'El Tango Cafe', '010-2415-0563 / eltangocafe@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Monday: Ahora Si
(gen_random_uuid(), 'Ahora Si - Monday at Tango Andante', 'Every Monday milonga at Tango Andante near Hongdae. Cozy basement venue.', 'milonga', 'Tango Andante', 'B1, SunJin Building, 24 Yanghwa-ro 12-gil, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5547, 126.9172, '2026-03-02 21:00:00+09', '2026-03-03 00:00:00+09', '8,000 KRW', 'KRW', NULL, 'mrsun@daum.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Monday: Luminoso
(gen_random_uuid(), 'Luminoso - Monday at EnPaz Studio', 'Every Monday milonga at EnPaz Studio in Seocho-gu, near Banpo.', 'milonga', 'EnPaz Studio', '82 Banpo-daero 30-gil, Seocho-gu, Seoul', 'Seoul', 'KR', 37.5042, 127.0040, '2026-03-02 19:00:00+09', '2026-03-02 23:00:00+09', '10,000 KRW', 'KRW', NULL, '010-2017-4933 / lsc210@daum.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Tuesday: Milonga UNO
(gen_random_uuid(), 'Milonga UNO - Tuesday at Tango o Nada 2', 'Every Tuesday milonga at Tango o Nada 2 in Mapo-gu. Every 4th Tuesday is tradition night.', 'milonga', 'Tango o Nada 2', 'B1F, 187 Seongmisan-ro, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5573, 126.9199, '2026-03-03 20:30:00+09', '2026-03-04 00:30:00+09', '10,000 KRW', 'KRW', NULL, 'taeyang428@gmail.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Tuesday: Farol
(gen_random_uuid(), 'Farol - Tuesday at Tango Andante', 'Every Tuesday milonga at Tango Andante near Hongdae. Organized by Jeff.', 'milonga', 'Tango Andante', 'B1, 24 Yanghwa-ro 12-gil, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5547, 126.9172, '2026-03-03 21:00:00+09', '2026-03-04 00:00:00+09', '10,000 KRW', 'KRW', 'Jeff', 'mrsun@daum.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Wednesday: Senor Tango
(gen_random_uuid(), 'Senor Tango - Wednesday at Tangueria Del Buen Ayre', 'Every Wednesday milonga at Tangueria Del Buen Ayre in Sinsa-dong, Gangnam.', 'milonga', 'Tangueria Del Buen Ayre', '567-21 Sinsa-dong, Gangnam-gu, Seoul', 'Seoul', 'KR', 37.5168, 127.0213, '2026-03-04 20:00:00+09', '2026-03-05 00:30:00+09', '9,000 KRW', 'KRW', 'Senor Tango', '017-253-0560 / ABGuimbatan@gmail.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Wednesday: La Casa (monthly 1st Wed)
(gen_random_uuid(), 'La Casa - 1st Wednesday at El Tango Cafe', 'Monthly milonga on the first Wednesday of each month at El Tango Cafe in Seocho-gu.', 'milonga', 'El Tango Cafe', 'Gangnam-daero 95-gil 12, Seocho-gu, Seoul', 'Seoul', 'KR', 37.5110, 127.0115, '2026-03-04 20:30:00+09', '2026-03-05 00:30:00+09', '11,000 KRW', 'KRW', 'La Casa', 'milonga.LaCasa@groups.facebook.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Thursday: Tango Joven
(gen_random_uuid(), 'Tango Joven - Thursday at Tangueria Del Buen Ayre', 'Every Thursday milonga at Tangueria Del Buen Ayre in Sinsa-dong, Gangnam.', 'milonga', 'Tangueria Del Buen Ayre', '567-21 Sinsa-dong, Gangnam-gu, Seoul', 'Seoul', 'KR', 37.5168, 127.0213, '2026-03-05 20:00:00+09', '2026-03-06 00:45:00+09', '9,000 KRW', 'KRW', NULL, '017-253-0560 / ABGuimbatan@gmail.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Thursday: Milonga del CORAZON (sur)
(gen_random_uuid(), 'Milonga del CORAZON Sur - Thursday at El Tango', 'Every Thursday milonga at El Tango in Jamwon-dong, Seocho-gu.', 'milonga', 'El Tango', 'Jamwon-dong 27-11, Seocho-gu, Seoul', 'Seoul', 'KR', 37.5110, 127.0115, '2026-03-05 19:30:00+09', '2026-03-06 01:00:00+09', '10,000 KRW', 'KRW', 'Milonga del CORAZON', '010-3214-3269 / s2jazz@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Thursday: Mong
(gen_random_uuid(), 'Mong - Thursday at Tango Andante', 'Every Thursday milonga at Tango Andante in Mapo-gu. Open until 1:30am.', 'milonga', 'Tango Andante', 'B1, 24 Yanghwa-ro 12-gil, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5547, 126.9172, '2026-03-05 19:30:00+09', '2026-03-06 01:30:00+09', '12,000 KRW', 'KRW', NULL, '010-7636-3383 / jazzjava@gmail.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Friday: El Tango Cafe
(gen_random_uuid(), 'El Tango Cafe - Friday Milonga', 'Every Friday milonga at El Tango Cafe in Jamwon-dong. Open until 2am.', 'milonga', 'El Tango Cafe', 'Jamwon-dong 27-11, Seocho-gu, Seoul', 'Seoul', 'KR', 37.5110, 127.0115, '2026-03-06 20:00:00+09', '2026-03-07 02:00:00+09', '9,000 KRW', 'KRW', 'El Tango Cafe', '070-7631-9898 / eltangocafe@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Friday: Milonga del CORAZON Norte
(gen_random_uuid(), 'Milonga del CORAZON Norte - Friday at River Tango', 'Every Friday milonga at River Tango in Sangsu-dong, Mapo-gu.', 'milonga', 'River Tango', '8F, 354 Sangsu-dong, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5496, 126.9226, '2026-03-06 21:00:00+09', '2026-03-07 02:00:00+09', '8,000 KRW', 'KRW', 'Milonga del CORAZON', '010-3214-3269', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Friday: Pasion
(gen_random_uuid(), 'Pasion - Friday at Tango Andante', 'Every Friday milonga at Tango Andante in Mapo-gu.', 'milonga', 'Tango Andante', 'B1, 24 Yanghwa-ro 12-gil, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5547, 126.9172, '2026-03-06 20:30:00+09', '2026-03-07 01:00:00+09', '10,000 KRW', 'KRW', NULL, 'mrsun@daum.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Friday: VIDA MIA
(gen_random_uuid(), 'VIDA MIA - Friday at EnPaz Studio', 'Every Friday milonga at EnPaz Studio in Seocho-gu.', 'milonga', 'EnPaz Studio', '82 Banpo-daero 30-gil, Seocho-gu, Seoul', 'Seoul', 'KR', 37.5042, 127.0040, '2026-03-06 19:00:00+09', '2026-03-06 23:00:00+09', '10,000 KRW', 'KRW', NULL, '010-6281-8288 / shinjaui@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Saturday: Sabato
(gen_random_uuid(), 'Sabato - Saturday at Tango Cafe', 'Every Saturday milonga at Tango Cafe near Chungmuro station.', 'milonga', 'Tango Cafe', 'B3 CAFE ON THE PLAN building, Chungmuro, Seoul', 'Seoul', 'KR', 37.5611, 126.9968, '2026-03-07 19:00:00+09', '2026-03-07 22:00:00+09', '9,000 KRW', 'KRW', NULL, '010-6836-1099 / brainzin@naver.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Saturday: Tango Seduction
(gen_random_uuid(), 'Tango Seduction - Saturday at Tangueria Del Buen Ayre', 'Every Saturday milonga at Tangueria Del Buen Ayre in Sinsa-dong. Open until 2am.', 'milonga', 'Tangueria Del Buen Ayre', '567-21 Sinsa-dong, Gangnam-gu, Seoul', 'Seoul', 'KR', 37.5168, 127.0213, '2026-03-07 20:30:00+09', '2026-03-08 02:00:00+09', '9,000 KRW', 'KRW', 'Tango Seduction', '017-253-0560 / ABGuimbatan@gmail.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Saturday: GangNam Milonga
(gen_random_uuid(), 'GangNam Milonga - Saturday', 'Every Saturday milonga at SK Hubzen bar in Gangnam. Premium venue.', 'milonga', 'SK Hubzen Bar', '109 Yeoksam-ro, Gangnam-gu, Seoul', 'Seoul', 'KR', 37.5012, 127.0365, '2026-03-07 19:00:00+09', '2026-03-07 23:00:00+09', '13,000 KRW', 'KRW', NULL, '010-9772-4990 / tangolife@naver.com', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Saturday: PhilATango (practica + milonga)
(gen_random_uuid(), 'PhilATango - Saturday Practica & Milonga', 'Every Saturday. Practica from 4pm, milonga from 9pm at Tango O Nada in Donggyo-dong.', 'practica', 'Tango O Nada', 'Donggyo-dong 200-29 B1, Mapo-gu, Seoul', 'Seoul', 'KR', 37.5576, 126.9237, '2026-03-07 16:00:00+09', '2026-03-08 03:00:00+09', '8,000 KRW', 'KRW', 'PhilATango', '010-9137-3710 / successk@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Saturday: Milonga del CORAZON Centro
(gen_random_uuid(), 'Milonga del CORAZON Centro - Saturday at Art Tango', 'Every Saturday milonga at Art Tango in Jung-gu, central Seoul.', 'milonga', 'Art Tango', '16-6 Poongsan B/D, Pildong 2-ga, Jung-gu, Seoul', 'Seoul', 'KR', 37.5600, 126.9970, '2026-03-07 20:30:00+09', '2026-03-08 00:00:00+09', '8,000 KRW', 'KRW', 'Milonga del CORAZON', '010-3214-3269 / s2jazz@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Saturday: Todo Tango
(gen_random_uuid(), 'Todo Tango - Saturday in Gangnam', 'Every Saturday milonga at Todo Tango dance hall in Gangnam.', 'milonga', 'Todo Tango Dance Hall', 'B1 Daemyeong building, 7 Eonju-ro 172-gil, Gangnam-gu, Seoul', 'Seoul', 'KR', 37.5107, 127.0372, '2026-03-07 18:00:00+09', '2026-03-07 22:00:00+09', '11,000 KRW', 'KRW', NULL, '010-7745-4324 / msddr@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW()),

-- Saturday: VOLVER
(gen_random_uuid(), 'VOLVER - Saturday at EnPaz Studio', 'Every Saturday milonga at EnPaz Studio in Seocho-gu.', 'milonga', 'EnPaz Studio', '82 Banpo-daero 30-gil, Seocho-gu, Seoul', 'Seoul', 'KR', 37.5042, 127.0040, '2026-03-07 19:00:00+09', '2026-03-07 23:00:00+09', '10,000 KRW', 'KRW', NULL, '010-6281-8288 / shinjaui@hanmail.net', 'https://milongas-in.com/milongas-in-asia.php?c=Korea&city=seoul', 'manual', true, 'active', NOW(), NOW());
