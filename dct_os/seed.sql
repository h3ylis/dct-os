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

-- Cost Codes
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

-- Work Orders
-- Project 1: Warrawong Road
INSERT INTO work_orders (id, project_id, number, description, status) VALUES
( 1, 1, 'W2500101', 'Mobilisation',          'Active'),
( 2, 1, 'W2500102', 'Earthworks',            'Active'),
( 3, 1, 'W2500103', 'Pavement Construction', 'Active'),
( 4, 1, 'W2500105', 'Drainage Works',        'Active'),
( 5, 1, 'W2500106', 'Traffic Management',    'Active'),
( 6, 1, 'W2500107', 'Line Marking',          'Active'),
( 7, 1, 'W2500108', 'Environmental',         'Active');

-- Project 2: Myall Creek
INSERT INTO work_orders (id, project_id, number, description, status) VALUES
( 8, 2, 'W2500201', 'Mobilisation',          'Active'),
( 9, 2, 'W2500202', 'Excavation',            'Active'),
(10, 2, 'W2500203', 'Culvert Installation',  'Active'),
(11, 2, 'W2500204', 'Headwall Construction', 'Active'),
(12, 2, 'W2500205', 'Backfill',              'Active'),
(13, 2, 'W2500206', 'Traffic Management',    'Active'),
(14, 2, 'W2500207', 'Reinstatement',         'Active');

-- Project 3: Tumbil Bridge
INSERT INTO work_orders (id, project_id, number, description, status) VALUES
(15, 3, 'W2500301', 'Mobilisation',       'Active'),
(16, 3, 'W2500302', 'Temporary Works',    'Active'),
(17, 3, 'W2500303', 'Substructure',       'Active'),
(18, 3, 'W2500304', 'Deck Replacement',   'Active'),
(19, 3, 'W2500306', 'Traffic Management', 'Active');

-- Project 4: Annual Patching
INSERT INTO work_orders (id, project_id, number, description, status) VALUES
(20, 4, 'W2500401', 'Mobilisation',       'Active'),
(21, 4, 'W2500402', 'Heavy Patching',     'Active'),
(22, 4, 'W2500403', 'Pothole Repairs',    'Active'),
(23, 4, 'W2500404', 'Shoulder Grading',   'Active'),
(24, 4, 'W2500405', 'Traffic Management', 'Active');

-- Purchase Orders
-- Project 1: Warrawong Road
INSERT INTO purchase_orders (id, project_id, number, supplier_name, value, raised_date, is_active) VALUES
( 1, 1, '45201', 'Redgum Civil Pty Ltd',       45000.00, '2025-01-20', 1),
( 2, 1, '45202', 'Blacksoil Earthmoving',      15000.00, '2025-01-22', 1),
( 3, 1, '45203', 'Clearway Traffic Services',    8000.00, '2025-01-25', 1),
( 4, 1, '45204', 'Ironbark Quarries',          55000.00, '2025-01-25', 1),
( 5, 1, '45205', 'Tablelands Equipment Hire',   5000.00, '2025-01-28', 1),
( 6, 1, '45206', 'Dawson Line Marking',        25000.00, '2025-03-10', 1),
( 7, 1, '45207', 'Valley Concrete Supply',      8000.00, '2025-02-01', 1),
( 8, 1, '45208', 'Greenfield Environmental',    8000.00, '2025-01-30', 1);

-- Project 2: Myall Creek
INSERT INTO purchase_orders (id, project_id, number, supplier_name, value, raised_date, is_active) VALUES
( 9, 2, '45301', 'Redgum Civil Pty Ltd',       35000.00, '2025-02-15', 1),
(10, 2, '45302', 'SafeZone Traffic Management',  6000.00, '2025-02-20', 1),
(11, 2, '45303', 'Valley Concrete Supply',      12000.00, '2025-03-01', 1),
(12, 2, '45304', 'Cobb & Murray Quarries',      10000.00, '2025-03-05', 1);

-- Project 3: Tumbil Bridge
INSERT INTO purchase_orders (id, project_id, number, supplier_name, value, raised_date, is_active) VALUES
(13, 3, '45401', 'Hawkridge Constructions',    30000.00, '2025-03-15', 1),
(14, 3, '45402', 'Clearway Traffic Services',    5000.00, '2025-03-20', 1),
(15, 3, '45403', 'Valley Concrete Supply',       8000.00, '2025-04-01', 1);

-- Project 4: Annual Patching
INSERT INTO purchase_orders (id, project_id, number, supplier_name, value, raised_date, is_active) VALUES
(16, 4, '45501', 'Blacksoil Earthmoving',      18000.00, '2025-01-25', 1),
(17, 4, '45502', 'SafeZone Traffic Management',  5000.00, '2025-01-28', 1);

-- WO <-> Cost Code matrix (which CCs are valid for each WO)
-- Project 1
INSERT INTO wo_cost_codes (work_order_id, cost_code_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 5), (5, 6), (6, 7), (7, 8);
-- Project 2
INSERT INTO wo_cost_codes (work_order_id, cost_code_id) VALUES
(8, 11), (9, 12), (10, 13), (11, 14), (12, 15), (13, 16), (14, 17);
-- Project 3
INSERT INTO wo_cost_codes (work_order_id, cost_code_id) VALUES
(15, 19), (16, 20), (17, 21), (18, 22), (19, 24);
-- Project 4
INSERT INTO wo_cost_codes (work_order_id, cost_code_id) VALUES
(20, 26), (21, 27), (22, 28), (23, 29), (24, 30);

-- PO <-> WO assignments (which POs fund which WOs)
-- Project 1: Redgum covers most WOs
INSERT INTO po_assignments (purchase_order_id, work_order_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 2), (2, 3),
(3, 5),
(4, 3), (4, 4),
(5, 2), (5, 3),
(6, 6),
(7, 4),
(8, 7);
-- Project 2
INSERT INTO po_assignments (purchase_order_id, work_order_id) VALUES
(9, 8), (9, 9), (9, 10), (9, 11), (9, 12), (9, 14),
(10, 13),
(11, 11),
(12, 12);
-- Project 3
INSERT INTO po_assignments (purchase_order_id, work_order_id) VALUES
(13, 15), (13, 16), (13, 17), (13, 18),
(14, 19),
(15, 18);
-- Project 4
INSERT INTO po_assignments (purchase_order_id, work_order_id) VALUES
(16, 20), (16, 21), (16, 22), (16, 23),
(17, 24);

-- Resources
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

-- ============================================================================
-- Docket Headers + Lines
-- ============================================================================
-- Each header = one physical docket from a supplier on a date.
-- Lines = individual items on that docket (equipment, materials, labour).
-- Grouped by supplier + date. Same supplier on the same date = one docket.
-- ============================================================================

-- Project 1: Warrawong Road — Redgum Civil
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
( 1, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-03', 'RGC-0001'),
( 2, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-04', 'RGC-0003'),
( 3, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-05', 'RGC-0005'),
( 4, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-06', 'RGC-0007'),
( 5, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-07', 'RGC-0009'),
( 6, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-10', 'RGC-0010'),
( 7, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-11', 'RGC-0012'),
( 8, 1, 1, 'Redgum Civil Pty Ltd', '2025-02-12', 'RGC-0013'),
( 9, 1, 1, 'Redgum Civil Pty Ltd', '2025-03-03', 'RGC-0016'),
(10, 1, 1, 'Redgum Civil Pty Ltd', '2025-03-04', 'RGC-0017'),
(11, 1, 1, 'Redgum Civil Pty Ltd', '2025-03-05', 'RGC-0018'),
(12, 1, 1, 'Redgum Civil Pty Ltd', '2025-03-06', 'RGC-0019'),
(13, 1, 1, 'Redgum Civil Pty Ltd', '2025-03-07', 'RGC-0020'),
(14, 1, 1, 'Redgum Civil Pty Ltd', '2025-03-10', 'RGC-0021'),
(15, 1, 1, 'Redgum Civil Pty Ltd', '2025-04-03', 'RGC-0028');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
( 1,  1,  1, 22, 'Mobilisation',          1.0,  'LS',   8500.00,  8500.00, 0),
( 1,  2,  2,  1, 'Earthworks — 20T Exc',  8.0,  'Hr',    220.00,  1760.00, 1),
( 2,  2,  2,  2, 'Earthworks — 10T Tip',  8.5,  'Hr',    125.00,  1062.50, 0),
( 2,  2,  2,  1, 'Earthworks — 20T Exc',  9.0,  'Hr',    220.00,  1980.00, 1),
( 3,  2,  2,  3, 'Earthworks — Grader',   7.0,  'Hr',    235.00,  1645.00, 0),
( 3,  2,  2,  8, 'Earthworks — Operator', 8.0,  'Hr',     95.00,   760.00, 1),
( 4,  2,  2,  1, 'Earthworks — 20T Exc',  8.0,  'Hr',    220.00,  1760.00, 0),
( 4,  2,  2,  9, 'Earthworks — Super',    8.0,  'Hr',    110.00,   880.00, 1),
( 5,  2,  2,  6, 'Earthworks — Loader',   6.5,  'Hr',    185.00,  1202.50, 0),
( 6,  2,  2,  2, 'Earthworks — 10T Tip',  9.0,  'Hr',    125.00,  1125.00, 0),
( 7,  4,  5,  1, 'Drainage — 20T Exc',    8.0,  'Hr',    220.00,  1760.00, 0),
( 8,  4,  5,  7, 'Drainage — Labour',    16.0,  'Hr',     85.00,  1360.00, 0),
( 9,  3,  3,  3, 'Pavement — Grader',     8.0,  'Hr',    235.00,  1880.00, 0),
(10,  3,  3,  4, 'Pavement — Roller',     1.0,  'Day',   280.00,   280.00, 0),
(11,  3,  3,  1, 'Pavement — 20T Exc',    8.0,  'Hr',    220.00,  1760.00, 0),
(12,  3,  3,  7, 'Pavement — Labour',    24.0,  'Hr',     85.00,  2040.00, 0),
(13,  3,  3,  9, 'Pavement — Super',      8.0,  'Hr',    110.00,   880.00, 0),
(14,  3,  3,  3, 'Pavement — Grader',     8.0,  'Hr',    235.00,  1880.00, 0),
(15,  3,  3,  7, 'Pavement — Labour',    16.0,  'Hr',     85.00,  1360.00, 0);

-- Project 1: Blacksoil Earthmoving
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(16, 1, 2, 'Blacksoil Earthmoving', '2025-02-03', 'BSE-0101'),
(17, 1, 2, 'Blacksoil Earthmoving', '2025-02-04', 'BSE-0102'),
(18, 1, 2, 'Blacksoil Earthmoving', '2025-02-05', 'BSE-0103'),
(19, 1, 2, 'Blacksoil Earthmoving', '2025-02-06', 'BSE-0104'),
(20, 1, 2, 'Blacksoil Earthmoving', '2025-02-07', 'BSE-0105'),
(21, 1, 2, 'Blacksoil Earthmoving', '2025-03-03', 'BSE-0111'),
(22, 1, 2, 'Blacksoil Earthmoving', '2025-03-04', 'BSE-0112'),
(23, 1, 2, 'Blacksoil Earthmoving', '2025-03-05', 'BSE-0113');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(16, 2, 2, 23, 'Earthworks — 10T Tip', 10.0, 'Hr', 130.00, 1300.00, 0),
(17, 2, 2, 23, 'Earthworks — 10T Tip',  9.5, 'Hr', 130.00, 1235.00, 0),
(18, 2, 2, 23, 'Earthworks — 10T Tip', 10.0, 'Hr', 130.00, 1300.00, 0),
(19, 2, 2, 24, 'Earthworks — 20T Exc',  8.0, 'Hr', 230.00, 1840.00, 0),
(20, 2, 2,  7, 'Earthworks — Labour',  16.0, 'Hr',  85.00, 1360.00, 0),
(21, 3, 3, 23, 'Pavement — 10T Tip',    9.0, 'Hr', 130.00, 1170.00, 0),
(22, 3, 3, 23, 'Pavement — 10T Tip',   10.0, 'Hr', 130.00, 1300.00, 0),
(23, 3, 3, 23, 'Pavement — 10T Tip',    8.5, 'Hr', 130.00, 1105.00, 0);

-- Project 1: Clearway Traffic Services
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(24, 1, 3, 'Clearway Traffic Services', '2025-02-03', 'CTS-2001'),
(25, 1, 3, 'Clearway Traffic Services', '2025-02-04', 'CTS-2002'),
(26, 1, 3, 'Clearway Traffic Services', '2025-02-05', 'CTS-2003'),
(27, 1, 3, 'Clearway Traffic Services', '2025-02-06', 'CTS-2004'),
(28, 1, 3, 'Clearway Traffic Services', '2025-02-07', 'CTS-2005'),
(29, 1, 3, 'Clearway Traffic Services', '2025-02-10', 'CTS-2006'),
(30, 1, 3, 'Clearway Traffic Services', '2025-02-11', 'CTS-2007'),
(31, 1, 3, 'Clearway Traffic Services', '2025-02-12', 'CTS-2008'),
(32, 1, 3, 'Clearway Traffic Services', '2025-03-03', 'CTS-2011'),
(33, 1, 3, 'Clearway Traffic Services', '2025-04-01', 'CTS-2016');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(24, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0),
(25, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0),
(26, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0),
(27, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0),
(28, 5, 6, 12, 'Traffic — TC Travel', 2.0, 'Ea',  120.00,  240.00, 0),
(29, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0),
(30, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0),
(31, 5, 6, 11, 'Traffic — Portable Light', 1.0, 'Day', 180.00, 180.00, 0),
(32, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0),
(33, 5, 6, 10, 'Traffic — 2P Crew',  8.0, 'Hr',   95.00,  760.00, 0);

-- Project 1: Ironbark Quarries
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(34, 1, 4, 'Ironbark Quarries', '2025-02-10', 'IBQ-3001'),
(35, 1, 4, 'Ironbark Quarries', '2025-02-11', 'IBQ-3002'),
(36, 1, 4, 'Ironbark Quarries', '2025-02-12', 'IBQ-3003'),
(37, 1, 4, 'Ironbark Quarries', '2025-03-03', 'IBQ-3004'),
(38, 1, 4, 'Ironbark Quarries', '2025-03-04', 'IBQ-3005'),
(39, 1, 4, 'Ironbark Quarries', '2025-03-05', 'IBQ-3006'),
(40, 1, 4, 'Ironbark Quarries', '2025-03-06', 'IBQ-3007'),
(41, 1, 4, 'Ironbark Quarries', '2025-03-10', 'IBQ-3008'),
(42, 1, 4, 'Ironbark Quarries', '2025-04-01', 'IBQ-3011'),
(43, 1, 4, 'Ironbark Quarries', '2025-04-02', 'IBQ-3012');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(34, 4, 5, 14, 'Drainage Rock',   45.0, 'Tonne', 38.00, 1710.00, 0),
(35, 4, 5, 14, 'Drainage Rock',   52.0, 'Tonne', 38.00, 1976.00, 0),
(36, 4, 5, 15, 'Select Fill',     80.0, 'Tonne', 28.00, 2240.00, 0),
(37, 3, 3, 13, 'DGB20',          120.0, 'Tonne', 42.00, 5040.00, 0),
(38, 3, 3, 13, 'DGB20',          135.0, 'Tonne', 42.00, 5670.00, 0),
(39, 3, 3, 13, 'DGB20',          110.0, 'Tonne', 42.00, 4620.00, 0),
(40, 3, 3, 13, 'DGB20',          140.0, 'Tonne', 42.00, 5880.00, 0),
(41, 3, 3, 13, 'DGB20',          125.0, 'Tonne', 42.00, 5250.00, 0),
(42, 3, 3, 13, 'DGB20',          100.0, 'Tonne', 42.00, 4200.00, 0),
(43, 3, 3, 13, 'DGB20',           95.0, 'Tonne', 46.00, 4370.00, 0);

-- Project 1: Tablelands Equipment Hire
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(44, 1, 5, 'Tablelands Equipment Hire', '2025-02-10', 'TEH-0501'),
(45, 1, 5, 'Tablelands Equipment Hire', '2025-03-03', 'TEH-0502'),
(46, 1, 5, 'Tablelands Equipment Hire', '2025-03-10', 'TEH-0503');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(44, 2, 2, 4, 'Roller hire',       5.0, 'Day', 290.00, 1450.00, 0),
(45, 3, 3, 4, 'Roller hire',       5.0, 'Day', 290.00, 1450.00, 0),
(46, 3, 3, 5, 'Watercart',         5.0, 'Day', 160.00,  800.00, 0);

-- Project 1: Valley Concrete Supply
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(47, 1, 7, 'Valley Concrete Supply', '2025-02-14', 'VCS-0801'),
(48, 1, 7, 'Valley Concrete Supply', '2025-03-06', 'VCS-0802'),
(49, 1, 7, 'Valley Concrete Supply', '2025-03-14', 'VCS-0803');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(47, 4, 5, 16, 'Concrete 32MPa',  6.0, 'm3', 275.00, 1650.00, 0),
(48, 4, 5, 16, 'Concrete 32MPa',  8.0, 'm3', 275.00, 2200.00, 0),
(49, 4, 5, 16, 'Concrete 32MPa',  4.5, 'm3', 275.00, 1237.50, 0);

-- Project 1: Greenfield Environmental
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(50, 1, 8, 'Greenfield Environmental', '2025-02-03', 'GFE-0401'),
(51, 1, 8, 'Greenfield Environmental', '2025-03-03', 'GFE-0402'),
(52, 1, 8, 'Greenfield Environmental', '2025-04-01', 'GFE-0403');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(50, 7, 8, 18, 'Env Consultant',   8.0, 'Hr',  145.00, 1160.00, 0),
(51, 7, 8, 19, 'Erosion Control',  1.0, 'LS', 3200.00, 3200.00, 0),
(52, 7, 8, 18, 'Env Consultant',   6.0, 'Hr',  145.00,  870.00, 0);

-- Project 1: Dawson Line Marking
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(53, 1, 6, 'Dawson Line Marking', '2025-04-14', 'DLM-0101'),
(54, 1, 6, 'Dawson Line Marking', '2025-04-15', 'DLM-0102');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(53, 6, 7, 20, 'Centre Line',    4200.0, 'm', 1.80, 7560.00, 0),
(54, 6, 7, 21, 'Edge Line',      8400.0, 'm', 1.50, 12600.00, 0);

-- Project 2: Myall Creek — Redgum Civil
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(55, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-10', 'RGC-0501'),
(56, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-11', 'RGC-0502'),
(57, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-12', 'RGC-0503'),
(58, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-13', 'RGC-0504'),
(59, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-14', 'RGC-0505'),
(60, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-18', 'RGC-0507'),
(61, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-19', 'RGC-0508'),
(62, 2, 9, 'Redgum Civil Pty Ltd', '2025-03-20', 'RGC-0509'),
(63, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-07', 'RGC-0511'),
(64, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-08', 'RGC-0512'),
(65, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-09', 'RGC-0513'),
(66, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-10', 'RGC-0514'),
(67, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-11', 'RGC-0515'),
(68, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-14', 'RGC-0517'),
(69, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-15', 'RGC-0518'),
(70, 2, 9, 'Redgum Civil Pty Ltd', '2025-04-16', 'RGC-0519');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(55,  8, 11, 22, 'Mobilisation',           1.0, 'LS',  5500.00, 5500.00, 0),
(56,  9, 12, 25, 'Excavation — 20T Exc',   8.0, 'Hr',   225.00, 1800.00, 0),
(57,  9, 12, 23, 'Excavation — 10T Tip',   8.0, 'Hr',   130.00, 1040.00, 0),
(58,  9, 12, 25, 'Excavation — 20T Exc',   9.0, 'Hr',   225.00, 2025.00, 0),
(59,  9, 12,  7, 'Excavation — Labour',   16.0, 'Hr',    85.00, 1360.00, 0),
(60, 10, 13, 25, 'Culvert — 20T Exc',      8.0, 'Hr',   225.00, 1800.00, 0),
(61, 10, 13,  7, 'Culvert — Labour',      24.0, 'Hr',    85.00, 2040.00, 0),
(62, 10, 13,  9, 'Culvert — Super',        8.0, 'Hr',   110.00,  880.00, 0),
(63, 11, 14,  7, 'Headwall — Labour',     16.0, 'Hr',    85.00, 1360.00, 0),
(64, 11, 14,  8, 'Headwall — Operator',    8.0, 'Hr',    95.00,  760.00, 0),
(65, 12, 15, 25, 'Backfill — 20T Exc',     8.0, 'Hr',   225.00, 1800.00, 0),
(66, 12, 15, 23, 'Backfill — 10T Tip',     9.0, 'Hr',   130.00, 1170.00, 0),
(67, 12, 15,  6, 'Backfill — Loader',      6.0, 'Hr',   185.00, 1110.00, 0),
(68, 14, 17,  3, 'Reinstatement — Grader', 8.0, 'Hr',   235.00, 1880.00, 0),
(69, 14, 17,  4, 'Reinstatement — Roller', 1.0, 'Day',  290.00,  290.00, 0),
(70, 14, 17,  7, 'Reinstatement — Labour', 8.0, 'Hr',    85.00,  680.00, 0);

-- Project 2: SafeZone Traffic Management
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(71, 2, 10, 'SafeZone Traffic Management', '2025-03-10', 'SZT-4001'),
(72, 2, 10, 'SafeZone Traffic Management', '2025-03-11', 'SZT-4002'),
(73, 2, 10, 'SafeZone Traffic Management', '2025-03-12', 'SZT-4003'),
(74, 2, 10, 'SafeZone Traffic Management', '2025-04-07', 'SZT-4006'),
(75, 2, 10, 'SafeZone Traffic Management', '2025-04-14', 'SZT-4008');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(71, 13, 16, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0),
(72, 13, 16, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0),
(73, 13, 16, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0),
(74, 13, 16, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0),
(75, 13, 16, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0);

-- Project 2: Valley Concrete Supply
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(76, 2, 11, 'Valley Concrete Supply', '2025-03-20', 'VCS-0901'),
(77, 2, 11, 'Valley Concrete Supply', '2025-04-07', 'VCS-0902'),
(78, 2, 11, 'Valley Concrete Supply', '2025-04-10', 'VCS-0903');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(76, 11, 14, 16, 'Concrete 32MPa', 12.0, 'm3', 275.00, 3300.00, 0),
(77, 11, 14, 16, 'Concrete 32MPa',  8.0, 'm3', 275.00, 2200.00, 0),
(78, 11, 14, 17, 'Concrete 25MPa', 10.0, 'm3', 255.00, 2550.00, 0);

-- Project 2: Cobb & Murray Quarries
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(79, 2, 12, 'Cobb & Murray Quarries', '2025-03-14', 'CMQ-6001'),
(80, 2, 12, 'Cobb & Murray Quarries', '2025-03-17', 'CMQ-6002'),
(81, 2, 12, 'Cobb & Murray Quarries', '2025-04-09', 'CMQ-6003'),
(82, 2, 12, 'Cobb & Murray Quarries', '2025-04-10', 'CMQ-6004');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(79, 12, 15, 14, 'Drainage Rock',  65.0, 'Tonne', 36.00, 2340.00, 0),
(80, 12, 15, 15, 'Select Fill',    90.0, 'Tonne', 26.00, 2340.00, 0),
(81, 12, 15, 15, 'Select Fill',    75.0, 'Tonne', 26.00, 1950.00, 0),
(82, 12, 15, 14, 'Drainage Rock',  48.0, 'Tonne', 36.00, 1728.00, 0);

-- Project 3: Tumbil Bridge — Hawkridge Constructions
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(83, 3, 13, 'Hawkridge Constructions', '2025-04-01', 'HRC-7001'),
(84, 3, 13, 'Hawkridge Constructions', '2025-04-02', 'HRC-7002'),
(85, 3, 13, 'Hawkridge Constructions', '2025-04-03', 'HRC-7003'),
(86, 3, 13, 'Hawkridge Constructions', '2025-04-04', 'HRC-7004'),
(87, 3, 13, 'Hawkridge Constructions', '2025-04-07', 'HRC-7005'),
(88, 3, 13, 'Hawkridge Constructions', '2025-04-08', 'HRC-7006'),
(89, 3, 13, 'Hawkridge Constructions', '2025-04-09', 'HRC-7007'),
(90, 3, 13, 'Hawkridge Constructions', '2025-04-10', 'HRC-7008'),
(91, 3, 13, 'Hawkridge Constructions', '2025-04-11', 'HRC-7009');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(83, 15, 19, 22, 'Mobilisation',           1.0, 'LS', 12000.00, 12000.00, 0),
(84, 16, 20, 25, 'Temp Works — 20T Exc',   8.0, 'Hr',   225.00,  1800.00, 0),
(85, 16, 20,  7, 'Temp Works — Labour',   16.0, 'Hr',    85.00,  1360.00, 0),
(86, 17, 21, 25, 'Substructure — 20T Exc', 8.0, 'Hr',   225.00,  1800.00, 0),
(87, 17, 21,  7, 'Substructure — Labour', 24.0, 'Hr',    85.00,  2040.00, 0),
(88, 17, 21,  9, 'Substructure — Super',   8.0, 'Hr',   110.00,   880.00, 0),
(89, 18, 22, 25, 'Deck — 20T Exc',         8.0, 'Hr',   225.00,  1800.00, 0),
(90, 18, 22,  7, 'Deck — Labour',         24.0, 'Hr',    85.00,  2040.00, 0),
(91, 18, 22,  9, 'Deck — Super',           8.0, 'Hr',   110.00,   880.00, 0);

-- Project 3: Valley Concrete Supply
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(92, 3, 15, 'Valley Concrete Supply', '2025-04-14', 'VCS-1001');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(92, 18, 22, 16, 'Concrete 32MPa', 18.0, 'm3', 275.00, 4950.00, 0);

-- Project 3: Clearway Traffic Services
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(93, 3, 14, 'Clearway Traffic Services', '2025-04-01', 'CTS-3001'),
(94, 3, 14, 'Clearway Traffic Services', '2025-04-02', 'CTS-3002'),
(95, 3, 14, 'Clearway Traffic Services', '2025-04-07', 'CTS-3003'),
(96, 3, 14, 'Clearway Traffic Services', '2025-04-09', 'CTS-3004');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(93, 19, 24, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 95.00, 760.00, 0),
(94, 19, 24, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 95.00, 760.00, 0),
(95, 19, 24, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 95.00, 760.00, 0),
(96, 19, 24, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 95.00, 760.00, 0);

-- Project 4: Annual Patching — Blacksoil Earthmoving
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
( 97, 4, 16, 'Blacksoil Earthmoving', '2025-02-03', 'BSE-0201'),
( 98, 4, 16, 'Blacksoil Earthmoving', '2025-02-10', 'BSE-0202'),
( 99, 4, 16, 'Blacksoil Earthmoving', '2025-02-11', 'BSE-0204'),
(100, 4, 16, 'Blacksoil Earthmoving', '2025-02-12', 'BSE-0205'),
(101, 4, 16, 'Blacksoil Earthmoving', '2025-03-03', 'BSE-0206'),
(102, 4, 16, 'Blacksoil Earthmoving', '2025-03-10', 'BSE-0208');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
( 97, 20, 26, 22, 'Mobilisation',            1.0, 'LS',  3500.00, 3500.00, 0),
( 98, 21, 27, 24, 'Heavy Patch — 20T Exc',   8.0, 'Hr',   230.00, 1840.00, 0),
( 98, 21, 27, 23, 'Heavy Patch — 10T Tip',   9.0, 'Hr',   130.00, 1170.00, 1),
( 99, 21, 27,  7, 'Heavy Patch — Labour',   16.0, 'Hr',    85.00, 1360.00, 0),
(100, 21, 27, 24, 'Heavy Patch — 20T Exc',   8.0, 'Hr',   230.00, 1840.00, 0),
(101, 22, 28, 24, 'Pothole — 20T Exc',       6.0, 'Hr',   230.00, 1380.00, 0),
(101, 22, 28, 23, 'Pothole — 10T Tip',       8.0, 'Hr',   130.00, 1040.00, 1),
(102, 23, 29,  3, 'Shoulder — Grader',        8.0, 'Hr',   235.00, 1880.00, 0),
(102, 23, 29,  5, 'Shoulder — Watercart',     4.0, 'Hr',   160.00,  640.00, 1);

-- Project 4: SafeZone Traffic Management
INSERT INTO docket_headers (id, project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(103, 4, 17, 'SafeZone Traffic Management', '2025-02-10', 'SZT-5001'),
(104, 4, 17, 'SafeZone Traffic Management', '2025-02-11', 'SZT-5002'),
(105, 4, 17, 'SafeZone Traffic Management', '2025-03-03', 'SZT-5003'),
(106, 4, 17, 'SafeZone Traffic Management', '2025-03-10', 'SZT-5004');

INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(103, 24, 30, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0),
(104, 24, 30, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0),
(105, 24, 30, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0),
(106, 24, 30, 10, 'Traffic — 2P Crew', 8.0, 'Hr', 98.00, 784.00, 0);
