-- ============================================================================
-- DCT-OS Demo Seed Data
-- ============================================================================
-- Fictional "Riverbend Shire Council" dataset for demonstration.
-- All names, values, and dates are synthetic.
-- ============================================================================

-- Projects
INSERT INTO projects (id, name, code, client, start_date, end_date, status) VALUES
(1, 'Warrawong Road Rehabilitation', 'RSC-2025-001', 'Riverbend Shire Council', '2025-01-10', '2025-06-30', 'Active'),
(2, 'Myall Creek Drainage Upgrade',  'RSC-2025-002', 'Riverbend Shire Council', '2025-02-05', '2025-05-30', 'Active'),
(3, 'Tumbil Bridge Strengthening',   'RSC-2025-003', 'Riverbend Shire Council', '2025-03-01', '2025-07-31', 'Active'),
(4, 'Annual Road Patching Program',  'RSC-2025-004', 'Riverbend Shire Council', '2025-01-15', '2025-12-31', 'Active');

-- Cost Codes — derived from work order structure
-- Project 1: Warrawong Road
INSERT INTO cost_codes (id, project_id, code, description, budget_amount) VALUES
( 1, 1, 'CC101', 'Mobilisation',         85000.00),
( 2, 1, 'CC102', 'Earthworks',          420000.00),
( 3, 1, 'CC103', 'Pavement Construction',650000.00),
( 4, 1, 'CC104', 'Spray Seal',          380000.00),
( 5, 1, 'CC105', 'Drainage Works',      210000.00),
( 6, 1, 'CC106', 'Traffic Management',  290000.00),
( 7, 1, 'CC107', 'Line Marking',         65000.00),
( 8, 1, 'CC108', 'Environmental',         45000.00),
( 9, 1, 'CC109', 'Road Furniture',        55000.00),
(10, 1, 'CC110', 'Demobilisation',        35000.00);

-- Project 2: Myall Creek
INSERT INTO cost_codes (id, project_id, code, description, budget_amount) VALUES
(11, 2, 'CC201', 'Mobilisation',          35000.00),
(12, 2, 'CC202', 'Excavation',           165000.00),
(13, 2, 'CC203', 'Culvert Installation', 220000.00),
(14, 2, 'CC204', 'Headwall Construction', 95000.00),
(15, 2, 'CC205', 'Backfill',              85000.00),
(16, 2, 'CC206', 'Traffic Management',    75000.00),
(17, 2, 'CC207', 'Reinstatement',         65000.00),
(18, 2, 'CC208', 'Environmental',          40000.00);

-- Project 3: Tumbil Bridge
INSERT INTO cost_codes (id, project_id, code, description, budget_amount) VALUES
(19, 3, 'CC301', 'Mobilisation',           65000.00),
(20, 3, 'CC302', 'Temporary Works',       180000.00),
(21, 3, 'CC303', 'Substructure',          340000.00),
(22, 3, 'CC304', 'Deck Replacement',      280000.00),
(23, 3, 'CC305', 'Approach Slabs',        120000.00),
(24, 3, 'CC306', 'Traffic Management',    140000.00),
(25, 3, 'CC307', 'Guardrail & Signage',    75000.00);

-- Project 4: Patching
INSERT INTO cost_codes (id, project_id, code, description, budget_amount) VALUES
(26, 4, 'CC401', 'Mobilisation',           15000.00),
(27, 4, 'CC402', 'Heavy Patching',        150000.00),
(28, 4, 'CC403', 'Pothole Repairs',        80000.00),
(29, 4, 'CC404', 'Shoulder Grading',       60000.00),
(30, 4, 'CC405', 'Traffic Management',     45000.00);

-- Resources — typical civil engineering rate card
INSERT INTO resources (id, description, unit, supplier_name, standard_rate, category) VALUES
( 1, '20T Excavator',              'Hr',    'Redgum Civil Pty Ltd',       220.00, 'Plant'),
( 2, '10T Tipper',                 'Hr',    'Redgum Civil Pty Ltd',       125.00, 'Plant'),
( 3, 'Grader',                     'Hr',    'Redgum Civil Pty Ltd',       235.00, 'Plant'),
( 4, 'Roller',                     'Day',   'Tablelands Equipment Hire',  280.00, 'Plant'),
( 5, 'Watercart',                  'Hr',    'Tablelands Equipment Hire',  160.00, 'Plant'),
( 6, 'Loader',                     'Hr',    'Redgum Civil Pty Ltd',       185.00, 'Plant'),
( 7, 'Labour',                     'Hr',    NULL,                          85.00, 'Labour'),
( 8, 'Plant Operator',             'Hr',    NULL,                          95.00, 'Labour'),
( 9, 'Supervisor',                 'Hr',    NULL,                         110.00, 'Labour'),
(10, '2 Person Crew - Weekday',    'Hr',    'Clearway Traffic Services',   95.00, 'Traffic'),
(11, 'Portable Traffic Light',     'Day',   'Clearway Traffic Services',  180.00, 'Traffic'),
(12, 'TC Travel',                  'Ea',    'Clearway Traffic Services',  120.00, 'Traffic'),
(13, 'DGB20 (Delivered)',          'Tonne', 'Ironbark Quarries',           42.00, 'Materials'),
(14, 'Drainage Rock',              'Tonne', 'Ironbark Quarries',           38.00, 'Materials'),
(15, 'Select Fill',                'Tonne', 'Ironbark Quarries',           28.00, 'Materials'),
(16, 'Concrete 32MPa',            'm3',    'Valley Concrete Supply',     275.00, 'Materials'),
(17, 'Concrete 25MPa',            'm3',    'Valley Concrete Supply',     255.00, 'Materials'),
(18, 'Environmental Consultant',   'Hr',    'Greenfield Environmental',   145.00, 'Professional'),
(19, 'Erosion Control',            'LS',    'Greenfield Environmental',  3200.00, 'Environmental'),
(20, 'Centre Line',                'm',     'Dawson Line Marking',          1.80, 'Line Marking'),
(21, 'Edge Line',                  'm',     'Dawson Line Marking',          1.50, 'Line Marking'),
(22, 'Mobilisation',               'LS',    NULL,                        8500.00, 'Preliminaries'),
(23, '10T Tipper (Blacksoil)',     'Hr',    'Blacksoil Earthmoving',      130.00, 'Plant'),
(24, '20T Excavator (Blacksoil)',  'Hr',    'Blacksoil Earthmoving',      230.00, 'Plant'),
(25, '20T Excavator (Hawk)',       'Hr',    'Hawkridge Constructions',    225.00, 'Plant');

-- Dockets — representative sample across all projects
-- Project 1: Warrawong Road — Redgum Civil
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(1,  1,  22, 'Redgum Civil Pty Ltd',     '2025-02-03', 'RGC-0001', 'Mobilisation',          1.0,  'LS',    8500.00,  8500.00, 'W2500101', '45201'),
(1,  2,   1, 'Redgum Civil Pty Ltd',     '2025-02-03', 'RGC-0002', 'Earthworks',            8.0,  'Hr',     220.00,  1760.00, 'W2500102', '45201'),
(1,  2,   2, 'Redgum Civil Pty Ltd',     '2025-02-04', 'RGC-0003', 'Earthworks',            8.5,  'Hr',     125.00,  1062.50, 'W2500102', '45201'),
(1,  2,   1, 'Redgum Civil Pty Ltd',     '2025-02-04', 'RGC-0004', 'Earthworks',            9.0,  'Hr',     220.00,  1980.00, 'W2500102', '45201'),
(1,  2,   3, 'Redgum Civil Pty Ltd',     '2025-02-05', 'RGC-0005', 'Earthworks',            7.0,  'Hr',     235.00,  1645.00, 'W2500102', '45201'),
(1,  2,   8, 'Redgum Civil Pty Ltd',     '2025-02-05', 'RGC-0006', 'Earthworks',            8.0,  'Hr',      95.00,   760.00, 'W2500102', '45201'),
(1,  2,   1, 'Redgum Civil Pty Ltd',     '2025-02-06', 'RGC-0007', 'Earthworks',            8.0,  'Hr',     220.00,  1760.00, 'W2500102', '45201'),
(1,  2,   9, 'Redgum Civil Pty Ltd',     '2025-02-06', 'RGC-0008', 'Earthworks',            8.0,  'Hr',     110.00,   880.00, 'W2500102', '45201'),
(1,  2,   6, 'Redgum Civil Pty Ltd',     '2025-02-07', 'RGC-0009', 'Earthworks',            6.5,  'Hr',     185.00,  1202.50, 'W2500102', '45201'),
(1,  2,   2, 'Redgum Civil Pty Ltd',     '2025-02-10', 'RGC-0010', 'Earthworks',            9.0,  'Hr',     125.00,  1125.00, 'W2500102', '45201'),
(1,  5,   1, 'Redgum Civil Pty Ltd',     '2025-02-11', 'RGC-0012', 'Drainage Works',        8.0,  'Hr',     220.00,  1760.00, 'W2500105', '45201'),
(1,  5,   7, 'Redgum Civil Pty Ltd',     '2025-02-12', 'RGC-0013', 'Drainage Works',       16.0,  'Hr',      85.00,  1360.00, 'W2500105', '45201'),
(1,  3,   3, 'Redgum Civil Pty Ltd',     '2025-03-03', 'RGC-0016', 'Pavement Construction', 8.0,  'Hr',     235.00,  1880.00, 'W2500103', '45201'),
(1,  3,   4, 'Redgum Civil Pty Ltd',     '2025-03-04', 'RGC-0017', 'Pavement Construction', 1.0,  'Day',    280.00,   280.00, 'W2500103', '45201'),
(1,  3,   1, 'Redgum Civil Pty Ltd',     '2025-03-05', 'RGC-0018', 'Pavement Construction', 8.0,  'Hr',     220.00,  1760.00, 'W2500103', '45201'),
(1,  3,   7, 'Redgum Civil Pty Ltd',     '2025-03-06', 'RGC-0019', 'Pavement Construction',24.0,  'Hr',      85.00,  2040.00, 'W2500103', '45201'),
(1,  3,   9, 'Redgum Civil Pty Ltd',     '2025-03-07', 'RGC-0020', 'Pavement Construction', 8.0,  'Hr',     110.00,   880.00, 'W2500103', '45201'),
(1,  3,   3, 'Redgum Civil Pty Ltd',     '2025-03-10', 'RGC-0021', 'Pavement Construction', 8.0,  'Hr',     235.00,  1880.00, 'W2500103', '45201'),
(1,  3,   7, 'Redgum Civil Pty Ltd',     '2025-04-03', 'RGC-0028', 'Pavement Construction',16.0,  'Hr',      85.00,  1360.00, 'W2500103', '45201');

-- Project 1: Blacksoil Earthmoving
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(1, 2, 23, 'Blacksoil Earthmoving', '2025-02-03', 'BSE-0101', 'Earthworks',           10.0, 'Hr', 130.00, 1300.00, 'W2500102', '45202'),
(1, 2, 23, 'Blacksoil Earthmoving', '2025-02-04', 'BSE-0102', 'Earthworks',            9.5, 'Hr', 130.00, 1235.00, 'W2500102', '45202'),
(1, 2, 23, 'Blacksoil Earthmoving', '2025-02-05', 'BSE-0103', 'Earthworks',           10.0, 'Hr', 130.00, 1300.00, 'W2500102', '45202'),
(1, 2, 24, 'Blacksoil Earthmoving', '2025-02-06', 'BSE-0104', 'Earthworks',            8.0, 'Hr', 230.00, 1840.00, 'W2500102', '45202'),
(1, 2,  7, 'Blacksoil Earthmoving', '2025-02-07', 'BSE-0105', 'Earthworks',           16.0, 'Hr',  85.00, 1360.00, 'W2500102', '45202'),
(1, 3, 23, 'Blacksoil Earthmoving', '2025-03-03', 'BSE-0111', 'Pavement Construction', 9.0, 'Hr', 130.00, 1170.00, 'W2500103', '45202'),
(1, 3, 23, 'Blacksoil Earthmoving', '2025-03-04', 'BSE-0112', 'Pavement Construction',10.0, 'Hr', 130.00, 1300.00, 'W2500103', '45202'),
(1, 3, 23, 'Blacksoil Earthmoving', '2025-03-05', 'BSE-0113', 'Pavement Construction', 8.5, 'Hr', 130.00, 1105.00, 'W2500103', '45202');

-- Project 1: Clearway Traffic Services
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(1, 6, 10, 'Clearway Traffic Services', '2025-02-03', 'CTS-2001', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203'),
(1, 6, 10, 'Clearway Traffic Services', '2025-02-04', 'CTS-2002', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203'),
(1, 6, 10, 'Clearway Traffic Services', '2025-02-05', 'CTS-2003', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203'),
(1, 6, 10, 'Clearway Traffic Services', '2025-02-06', 'CTS-2004', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203'),
(1, 6, 12, 'Clearway Traffic Services', '2025-02-07', 'CTS-2005', 'Traffic Management', 2.0, 'Ea',  120.00,  240.00, 'W2500106', '45203'),
(1, 6, 10, 'Clearway Traffic Services', '2025-02-10', 'CTS-2006', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203'),
(1, 6, 10, 'Clearway Traffic Services', '2025-02-11', 'CTS-2007', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203'),
(1, 6, 11, 'Clearway Traffic Services', '2025-02-12', 'CTS-2008', 'Traffic Management', 1.0, 'Day', 180.00,  180.00, 'W2500106', '45203'),
(1, 6, 10, 'Clearway Traffic Services', '2025-03-03', 'CTS-2011', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203'),
(1, 6, 10, 'Clearway Traffic Services', '2025-04-01', 'CTS-2016', 'Traffic Management', 8.0, 'Hr',   95.00,  760.00, 'W2500106', '45203');

-- Project 1: Ironbark Quarries (materials)
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(1, 5, 14, 'Ironbark Quarries', '2025-02-10', 'IBQ-3001', 'Drainage Works',         45.0, 'Tonne', 38.00, 1710.00, 'W2500105', '45204'),
(1, 5, 14, 'Ironbark Quarries', '2025-02-11', 'IBQ-3002', 'Drainage Works',         52.0, 'Tonne', 38.00, 1976.00, 'W2500105', '45204'),
(1, 5, 15, 'Ironbark Quarries', '2025-02-12', 'IBQ-3003', 'Drainage Works',         80.0, 'Tonne', 28.00, 2240.00, 'W2500105', '45204'),
(1, 3, 13, 'Ironbark Quarries', '2025-03-03', 'IBQ-3004', 'Pavement Construction', 120.0, 'Tonne', 42.00, 5040.00, 'W2500103', '45204'),
(1, 3, 13, 'Ironbark Quarries', '2025-03-04', 'IBQ-3005', 'Pavement Construction', 135.0, 'Tonne', 42.00, 5670.00, 'W2500103', '45204'),
(1, 3, 13, 'Ironbark Quarries', '2025-03-05', 'IBQ-3006', 'Pavement Construction', 110.0, 'Tonne', 42.00, 4620.00, 'W2500103', '45204'),
(1, 3, 13, 'Ironbark Quarries', '2025-03-06', 'IBQ-3007', 'Pavement Construction', 140.0, 'Tonne', 42.00, 5880.00, 'W2500103', '45204'),
(1, 3, 13, 'Ironbark Quarries', '2025-03-10', 'IBQ-3008', 'Pavement Construction', 125.0, 'Tonne', 42.00, 5250.00, 'W2500103', '45204'),
(1, 3, 13, 'Ironbark Quarries', '2025-04-01', 'IBQ-3011', 'Pavement Construction', 100.0, 'Tonne', 42.00, 4200.00, 'W2500103', '45204'),
(1, 3, 13, 'Ironbark Quarries', '2025-04-02', 'IBQ-3012', 'Pavement Construction',  95.0, 'Tonne', 46.00, 4370.00, 'W2500103', '45204');

-- Project 1: Other suppliers
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(1, 2,  4, 'Tablelands Equipment Hire', '2025-02-10', 'TEH-0501', 'Earthworks',            5.0, 'Day', 290.00, 1450.00, 'W2500102', '45205'),
(1, 3,  4, 'Tablelands Equipment Hire', '2025-03-03', 'TEH-0502', 'Pavement Construction', 5.0, 'Day', 290.00, 1450.00, 'W2500103', '45205'),
(1, 3,  5, 'Tablelands Equipment Hire', '2025-03-10', 'TEH-0503', 'Pavement Construction', 5.0, 'Day', 160.00,  800.00, 'W2500103', '45205'),
(1, 5, 16, 'Valley Concrete Supply',    '2025-02-14', 'VCS-0801', 'Drainage Works',        6.0, 'm3',  275.00, 1650.00, 'W2500105', '45207'),
(1, 5, 16, 'Valley Concrete Supply',    '2025-03-06', 'VCS-0802', 'Drainage Works',        8.0, 'm3',  275.00, 2200.00, 'W2500105', '45207'),
(1, 5, 16, 'Valley Concrete Supply',    '2025-03-14', 'VCS-0803', 'Drainage Works',        4.5, 'm3',  275.00, 1237.50, 'W2500105', '45207'),
(1, 8, 18, 'Greenfield Environmental',  '2025-02-03', 'GFE-0401', 'Environmental',         8.0, 'Hr',  145.00, 1160.00, 'W2500108', '45208'),
(1, 8, 19, 'Greenfield Environmental',  '2025-03-03', 'GFE-0402', 'Environmental',         1.0, 'LS', 3200.00, 3200.00, 'W2500108', '45208'),
(1, 8, 18, 'Greenfield Environmental',  '2025-04-01', 'GFE-0403', 'Environmental',         6.0, 'Hr',  145.00,  870.00, 'W2500108', '45208'),
(1, 7, 20, 'Dawson Line Marking',       '2025-04-14', 'DLM-0101', 'Line Marking',       4200.0, 'm',     1.80, 7560.00, 'W2500107', '45206'),
(1, 7, 21, 'Dawson Line Marking',       '2025-04-15', 'DLM-0102', 'Line Marking',       8400.0, 'm',     1.50,12600.00, 'W2500107', '45206');

-- Project 2: Myall Creek — Redgum Civil
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(2, 11, 22, 'Redgum Civil Pty Ltd', '2025-03-10', 'RGC-0501', 'Mobilisation',          1.0, 'LS',  5500.00, 5500.00, 'W2500201', '45301'),
(2, 12, 25, 'Redgum Civil Pty Ltd', '2025-03-11', 'RGC-0502', 'Excavation',            8.0, 'Hr',   225.00, 1800.00, 'W2500202', '45301'),
(2, 12, 23, 'Redgum Civil Pty Ltd', '2025-03-12', 'RGC-0503', 'Excavation',            8.0, 'Hr',   130.00, 1040.00, 'W2500202', '45301'),
(2, 12, 25, 'Redgum Civil Pty Ltd', '2025-03-13', 'RGC-0504', 'Excavation',            9.0, 'Hr',   225.00, 2025.00, 'W2500202', '45301'),
(2, 12,  7, 'Redgum Civil Pty Ltd', '2025-03-14', 'RGC-0505', 'Excavation',           16.0, 'Hr',    85.00, 1360.00, 'W2500202', '45301'),
(2, 13, 25, 'Redgum Civil Pty Ltd', '2025-03-18', 'RGC-0507', 'Culvert Installation',  8.0, 'Hr',   225.00, 1800.00, 'W2500203', '45301'),
(2, 13,  7, 'Redgum Civil Pty Ltd', '2025-03-19', 'RGC-0508', 'Culvert Installation', 24.0, 'Hr',    85.00, 2040.00, 'W2500203', '45301'),
(2, 13,  9, 'Redgum Civil Pty Ltd', '2025-03-20', 'RGC-0509', 'Culvert Installation',  8.0, 'Hr',   110.00,  880.00, 'W2500203', '45301'),
(2, 14,  7, 'Redgum Civil Pty Ltd', '2025-04-07', 'RGC-0511', 'Headwall Construction',16.0, 'Hr',    85.00, 1360.00, 'W2500204', '45301'),
(2, 14,  8, 'Redgum Civil Pty Ltd', '2025-04-08', 'RGC-0512', 'Headwall Construction', 8.0, 'Hr',    95.00,  760.00, 'W2500204', '45301'),
(2, 15, 25, 'Redgum Civil Pty Ltd', '2025-04-09', 'RGC-0513', 'Backfill',              8.0, 'Hr',   225.00, 1800.00, 'W2500205', '45301'),
(2, 15, 23, 'Redgum Civil Pty Ltd', '2025-04-10', 'RGC-0514', 'Backfill',              9.0, 'Hr',   130.00, 1170.00, 'W2500205', '45301'),
(2, 15,  6, 'Redgum Civil Pty Ltd', '2025-04-11', 'RGC-0515', 'Backfill',              6.0, 'Hr',   185.00, 1110.00, 'W2500205', '45301'),
(2, 17,  3, 'Redgum Civil Pty Ltd', '2025-04-14', 'RGC-0517', 'Reinstatement',         8.0, 'Hr',   235.00, 1880.00, 'W2500207', '45301'),
(2, 17,  4, 'Redgum Civil Pty Ltd', '2025-04-15', 'RGC-0518', 'Reinstatement',         1.0, 'Day',  290.00,  290.00, 'W2500207', '45301'),
(2, 17,  7, 'Redgum Civil Pty Ltd', '2025-04-16', 'RGC-0519', 'Reinstatement',         8.0, 'Hr',    85.00,  680.00, 'W2500207', '45301');

-- Project 2: SafeZone Traffic, Valley Concrete, Cobb & Murray
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(2, 16, 10, 'SafeZone Traffic Management', '2025-03-10', 'SZT-4001', 'Traffic Management', 8.0, 'Hr',  98.00,  784.00, 'W2500206', '45302'),
(2, 16, 10, 'SafeZone Traffic Management', '2025-03-11', 'SZT-4002', 'Traffic Management', 8.0, 'Hr',  98.00,  784.00, 'W2500206', '45302'),
(2, 16, 10, 'SafeZone Traffic Management', '2025-03-12', 'SZT-4003', 'Traffic Management', 8.0, 'Hr',  98.00,  784.00, 'W2500206', '45302'),
(2, 16, 10, 'SafeZone Traffic Management', '2025-04-07', 'SZT-4006', 'Traffic Management', 8.0, 'Hr',  98.00,  784.00, 'W2500206', '45302'),
(2, 16, 10, 'SafeZone Traffic Management', '2025-04-14', 'SZT-4008', 'Traffic Management', 8.0, 'Hr',  98.00,  784.00, 'W2500206', '45302'),
(2, 14, 16, 'Valley Concrete Supply',      '2025-03-20', 'VCS-0901', 'Headwall Construction',12.0, 'm3', 275.00, 3300.00, 'W2500204', '45303'),
(2, 14, 16, 'Valley Concrete Supply',      '2025-04-07', 'VCS-0902', 'Headwall Construction', 8.0, 'm3', 275.00, 2200.00, 'W2500204', '45303'),
(2, 14, 17, 'Valley Concrete Supply',      '2025-04-10', 'VCS-0903', 'Headwall Construction',10.0, 'm3', 255.00, 2550.00, 'W2500204', '45303'),
(2, 15, 14, 'Cobb & Murray Quarries',      '2025-03-14', 'CMQ-6001', 'Backfill',            65.0, 'Tonne', 36.00, 2340.00, 'W2500205', '45304'),
(2, 15, 15, 'Cobb & Murray Quarries',      '2025-03-17', 'CMQ-6002', 'Backfill',            90.0, 'Tonne', 26.00, 2340.00, 'W2500205', '45304'),
(2, 15, 15, 'Cobb & Murray Quarries',      '2025-04-09', 'CMQ-6003', 'Backfill',            75.0, 'Tonne', 26.00, 1950.00, 'W2500205', '45304'),
(2, 15, 14, 'Cobb & Murray Quarries',      '2025-04-10', 'CMQ-6004', 'Backfill',            48.0, 'Tonne', 36.00, 1728.00, 'W2500205', '45304');

-- Project 3: Tumbil Bridge — Hawkridge Constructions
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(3, 19, 22, 'Hawkridge Constructions',  '2025-04-01', 'HRC-7001', 'Mobilisation',       1.0, 'LS',  12000.00, 12000.00, 'W2500301', '45401'),
(3, 20, 25, 'Hawkridge Constructions',  '2025-04-02', 'HRC-7002', 'Temporary Works',    8.0, 'Hr',    225.00,  1800.00, 'W2500302', '45401'),
(3, 20,  7, 'Hawkridge Constructions',  '2025-04-03', 'HRC-7003', 'Temporary Works',   16.0, 'Hr',     85.00,  1360.00, 'W2500302', '45401'),
(3, 21, 25, 'Hawkridge Constructions',  '2025-04-04', 'HRC-7004', 'Substructure',       8.0, 'Hr',    225.00,  1800.00, 'W2500303', '45401'),
(3, 21,  7, 'Hawkridge Constructions',  '2025-04-07', 'HRC-7005', 'Substructure',      24.0, 'Hr',     85.00,  2040.00, 'W2500303', '45401'),
(3, 21,  9, 'Hawkridge Constructions',  '2025-04-08', 'HRC-7006', 'Substructure',       8.0, 'Hr',    110.00,   880.00, 'W2500303', '45401'),
(3, 22, 25, 'Hawkridge Constructions',  '2025-04-09', 'HRC-7007', 'Deck Replacement',   8.0, 'Hr',    225.00,  1800.00, 'W2500304', '45401'),
(3, 22,  7, 'Hawkridge Constructions',  '2025-04-10', 'HRC-7008', 'Deck Replacement',  24.0, 'Hr',     85.00,  2040.00, 'W2500304', '45401'),
(3, 22,  9, 'Hawkridge Constructions',  '2025-04-11', 'HRC-7009', 'Deck Replacement',   8.0, 'Hr',    110.00,   880.00, 'W2500304', '45401'),
(3, 22, 16, 'Valley Concrete Supply',   '2025-04-14', 'VCS-1001', 'Deck Replacement',  18.0, 'm3',    275.00,  4950.00, 'W2500304', '45403'),
(3, 24, 10, 'Clearway Traffic Services', '2025-04-01', 'CTS-3001', 'Traffic Management', 8.0, 'Hr',     95.00,   760.00, 'W2500306', '45402'),
(3, 24, 10, 'Clearway Traffic Services', '2025-04-02', 'CTS-3002', 'Traffic Management', 8.0, 'Hr',     95.00,   760.00, 'W2500306', '45402'),
(3, 24, 10, 'Clearway Traffic Services', '2025-04-07', 'CTS-3003', 'Traffic Management', 8.0, 'Hr',     95.00,   760.00, 'W2500306', '45402'),
(3, 24, 10, 'Clearway Traffic Services', '2025-04-09', 'CTS-3004', 'Traffic Management', 8.0, 'Hr',     95.00,   760.00, 'W2500306', '45402');

-- Project 4: Annual Patching — Blacksoil Earthmoving + SafeZone
INSERT INTO dockets (project_id, cost_code_id, resource_id, supplier_name, date, docket_number, description, qty, unit, rate, amount, wo_number, po_number) VALUES
(4, 26, 22, 'Blacksoil Earthmoving',       '2025-02-03', 'BSE-0201', 'Mobilisation',       1.0, 'LS',  3500.00, 3500.00, 'W2500401', '45501'),
(4, 27, 24, 'Blacksoil Earthmoving',       '2025-02-10', 'BSE-0202', 'Heavy Patching',     8.0, 'Hr',   230.00, 1840.00, 'W2500402', '45501'),
(4, 27, 23, 'Blacksoil Earthmoving',       '2025-02-10', 'BSE-0203', 'Heavy Patching',     9.0, 'Hr',   130.00, 1170.00, 'W2500402', '45501'),
(4, 27,  7, 'Blacksoil Earthmoving',       '2025-02-11', 'BSE-0204', 'Heavy Patching',    16.0, 'Hr',    85.00, 1360.00, 'W2500402', '45501'),
(4, 27, 24, 'Blacksoil Earthmoving',       '2025-02-12', 'BSE-0205', 'Heavy Patching',     8.0, 'Hr',   230.00, 1840.00, 'W2500402', '45501'),
(4, 28, 24, 'Blacksoil Earthmoving',       '2025-03-03', 'BSE-0206', 'Pothole Repairs',    6.0, 'Hr',   230.00, 1380.00, 'W2500403', '45501'),
(4, 28, 23, 'Blacksoil Earthmoving',       '2025-03-03', 'BSE-0207', 'Pothole Repairs',    8.0, 'Hr',   130.00, 1040.00, 'W2500403', '45501'),
(4, 29,  3, 'Blacksoil Earthmoving',       '2025-03-10', 'BSE-0208', 'Shoulder Grading',   8.0, 'Hr',   235.00, 1880.00, 'W2500404', '45501'),
(4, 29,  5, 'Blacksoil Earthmoving',       '2025-03-10', 'BSE-0209', 'Shoulder Grading',   4.0, 'Hr',   160.00,  640.00, 'W2500404', '45501'),
(4, 30, 10, 'SafeZone Traffic Management', '2025-02-10', 'SZT-5001', 'Traffic Management', 8.0, 'Hr',    98.00,  784.00, 'W2500405', '45502'),
(4, 30, 10, 'SafeZone Traffic Management', '2025-02-11', 'SZT-5002', 'Traffic Management', 8.0, 'Hr',    98.00,  784.00, 'W2500405', '45502'),
(4, 30, 10, 'SafeZone Traffic Management', '2025-03-03', 'SZT-5003', 'Traffic Management', 8.0, 'Hr',    98.00,  784.00, 'W2500405', '45502'),
(4, 30, 10, 'SafeZone Traffic Management', '2025-03-10', 'SZT-5004', 'Traffic Management', 8.0, 'Hr',    98.00,  784.00, 'W2500405', '45502');
