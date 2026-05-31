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

-- No demo dockets — users start with a clean slate and enter their own.
