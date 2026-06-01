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

-- Demo dockets for Project 1 (Warrawong Road) only.
-- No source_hash or source_filename — these are manual entries.

-- Header 1: Mobilisation
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes) VALUES
(1, 1, 'Redgum Civil Pty Ltd', '2025-01-20', 'RGC-0001', 'Site establishment and mob');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(1, 1, 1, 22, 'Mobilisation', 1, 'LS', 8500.00, 8500.00, 0);

-- Header 2: Earthworks day 1
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 1, 'Redgum Civil Pty Ltd', '2025-01-22', 'RGC-0003');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(2, 2, 2, 1, '20T Excavator', 8, 'Hr', 220.00, 1760.00, 0),
(2, 2, 2, 2, '10T Tipper', 6, 'Hr', 125.00, 750.00, 1);

-- Header 3: Blacksoil earthworks
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 2, 'Blacksoil Earthmoving', '2025-01-23', 'BSE-0012');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(3, 2, 2, 24, '20T Excavator (Blacksoil)', 10, 'Hr', 230.00, 2300.00, 0),
(3, 2, 2, 23, '10T Tipper (Blacksoil)', 8, 'Hr', 130.00, 1040.00, 1);

-- Header 4: Traffic management setup
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 3, 'Clearway Traffic Services', '2025-01-24', 'CTS-0045');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(4, 5, 6, 10, '2 Person Crew - Weekday', 8, 'Hr', 95.00, 760.00, 0),
(4, 5, 6, 11, 'Portable Traffic Light', 1, 'Day', 180.00, 180.00, 1),
(4, 5, 6, 12, 'TC Travel', 2, 'Ea', 120.00, 240.00, 2);

-- Header 5: Pavement materials delivery
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes) VALUES
(1, 4, 'Ironbark Quarries', '2025-01-27', 'IQ-2301', 'First load to stockpile area');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(5, 3, 3, 13, 'DGB20 (Delivered)', 120, 'Tonne', 42.00, 5040.00, 0),
(5, 3, 3, 15, 'Select Fill', 80, 'Tonne', 28.00, 2240.00, 1);

-- Header 6: Earthworks grading
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 1, 'Redgum Civil Pty Ltd', '2025-01-28', 'RGC-0007');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(6, 2, 2, 3, 'Grader', 8, 'Hr', 235.00, 1880.00, 0),
(6, 2, 2, 6, 'Loader', 4, 'Hr', 185.00, 740.00, 1);

-- Header 7: Compaction and watering
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 5, 'Tablelands Equipment Hire', '2025-01-29', 'TEH-0088');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(7, 2, 2, 4, 'Roller', 1, 'Day', 280.00, 280.00, 0),
(7, 2, 2, 5, 'Watercart', 6, 'Hr', 160.00, 960.00, 1);

-- Header 8: Pavement construction
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 1, 'Redgum Civil Pty Ltd', '2025-02-03', 'RGC-0009');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(8, 3, 3, 1, '20T Excavator', 9, 'Hr', 220.00, 1980.00, 0),
(8, 3, 3, 2, '10T Tipper', 7, 'Hr', 125.00, 875.00, 1);

-- Header 9: More pavement material
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 4, 'Ironbark Quarries', '2025-02-04', 'IQ-2315');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(9, 3, 3, 13, 'DGB20 (Delivered)', 85, 'Tonne', 42.00, 3570.00, 0);

-- Header 10: Traffic management ongoing
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 3, 'Clearway Traffic Services', '2025-02-05', 'CTS-0052');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(10, 5, 6, 10, '2 Person Crew - Weekday', 10, 'Hr', 95.00, 950.00, 0),
(10, 5, 6, 12, 'TC Travel', 2, 'Ea', 120.00, 240.00, 1);

-- Header 11: Environmental inspection
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 8, 'Greenfield Environmental', '2025-02-06', 'GFE-0003');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(11, 7, 8, 18, 'Environmental Consultant', 6, 'Hr', 145.00, 870.00, 0);

-- Header 12: Drainage concrete
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 7, 'Valley Concrete Supply', '2025-02-10', 'VCS-0201');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(12, 4, 5, 17, 'Concrete 25MPa', 4, 'm3', 255.00, 1020.00, 0);

-- Header 13: Drainage excavation
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 1, 'Redgum Civil Pty Ltd', '2025-02-12', 'RGC-0012');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(13, 4, 5, 1, '20T Excavator', 6, 'Hr', 220.00, 1320.00, 0),
(13, 4, 5, 6, 'Loader', 3, 'Hr', 185.00, 555.00, 1);

-- Header 14: Drainage rock delivery
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 4, 'Ironbark Quarries', '2025-02-14', 'IQ-2328');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(14, 4, 5, 14, 'Drainage Rock', 45, 'Tonne', 38.00, 1710.00, 0);

-- Header 15: Pavement grading
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 1, 'Redgum Civil Pty Ltd', '2025-02-18', 'RGC-0015');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(15, 3, 3, 3, 'Grader', 10, 'Hr', 235.00, 2350.00, 0);

-- Header 16: Blacksoil pavement assist
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 2, 'Blacksoil Earthmoving', '2025-02-20', 'BSE-0019');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(16, 3, 3, 24, '20T Excavator (Blacksoil)', 8, 'Hr', 230.00, 1840.00, 0);

-- Header 17: Line marking
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes) VALUES
(1, 6, 'Dawson Line Marking', '2025-03-15', 'DLM-0008', 'Full length both directions');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(17, 6, 7, 20, 'Centre Line', 2400, 'm', 1.80, 4320.00, 0),
(17, 6, 7, 21, 'Edge Line', 4800, 'm', 1.50, 7200.00, 1);

-- Header 18: Erosion control
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number) VALUES
(1, 8, 'Greenfield Environmental', '2025-03-18', 'GFE-0007');
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, description, qty, unit, rate, amount, sort_order) VALUES
(18, 7, 8, 19, 'Erosion Control', 1, 'LS', 3200.00, 3200.00, 0);
