-- ============================================================================
-- DCT-OS Demo Seed Data
-- ============================================================================
-- Fictional "Riverbend Shire Council" dataset for demonstration.
-- All names, values, and dates are synthetic.
-- ============================================================================

-- Projects
INSERT INTO projects (id, name, code, client, start_date, end_date, status) VALUES
(1, 'Warrawong Road Rehabilitation', 'RSC-2025-001', 'Riverbend Shire Council', '2025-01-10', '2025-06-30', 'Active');

-- Cost Codes
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

-- Work Orders
INSERT INTO work_orders (id, project_id, number, description, status) VALUES
( 1, 1, 'W2500101', 'Mobilisation',          'Active'),
( 2, 1, 'W2500102', 'Earthworks',            'Active'),
( 3, 1, 'W2500103', 'Pavement Construction', 'Active'),
( 4, 1, 'W2500105', 'Drainage Works',        'Active'),
( 5, 1, 'W2500106', 'Traffic Management',    'Active'),
( 6, 1, 'W2500107', 'Line Marking',          'Active'),
( 7, 1, 'W2500108', 'Environmental',         'Active');

-- Purchase Orders
INSERT INTO purchase_orders (id, project_id, number, supplier_name, value, raised_date, is_active) VALUES
( 1, 1, '45201', 'Redgum Civil Pty Ltd',       45000.00, '2025-01-20', 1),
( 2, 1, '45202', 'Blacksoil Earthmoving',      15000.00, '2025-01-22', 1),
( 3, 1, '45203', 'Clearway Traffic Services',    8000.00, '2025-01-25', 1),
( 4, 1, '45204', 'Ironbark Quarries',          55000.00, '2025-01-25', 1),
( 5, 1, '45205', 'Tablelands Equipment Hire',   5000.00, '2025-01-28', 1),
( 6, 1, '45206', 'Dawson Line Marking',        25000.00, '2025-03-10', 1),
( 7, 1, '45207', 'Valley Concrete Supply',      8000.00, '2025-02-01', 1),
( 8, 1, '45208', 'Greenfield Environmental',    8000.00, '2025-01-30', 1);

-- WO <-> Cost Code matrix (which CCs are valid for each WO)
INSERT INTO wo_cost_codes (work_order_id, cost_code_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 5), (5, 6), (6, 7), (7, 8);

-- PO <-> WO assignments (which POs fund which WOs)
INSERT INTO po_assignments (purchase_order_id, work_order_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 2), (2, 3),
(3, 5),
(4, 3), (4, 4),
(5, 2), (5, 3),
(6, 6),
(7, 4),
(8, 7);

-- Resources
INSERT INTO resources (id, description, details, unit, supplier_name, standard_rate, category) VALUES
( 1, '20T Excavator',              'Komatsu PC200, GP + mud buckets, wet hire',    'Hr',    'Redgum Civil Pty Ltd',       220.00, 'Plant'),
( 2, '10T Tipper',                 'Isuzu FVZ tandem, wet hire',                   'Hr',    'Redgum Civil Pty Ltd',       125.00, 'Plant'),
( 3, 'Grader',                     'Cat 12M, 14ft blade, GPS fitted',              'Hr',    'Redgum Civil Pty Ltd',       235.00, 'Plant'),
( 4, 'Roller',                     'Ammann 12t smooth drum, padfoot shell avail.', 'Day',   'Tablelands Equipment Hire',  280.00, 'Plant'),
( 5, 'Watercart',                  '14,000L on Hino 500, dribble bar + cannon',    'Hr',    'Tablelands Equipment Hire',  160.00, 'Plant'),
( 6, 'Loader',                     'Cat 938, 2.5m3 GP bucket',                     'Hr',    'Redgum Civil Pty Ltd',       185.00, 'Plant'),
( 7, 'Labour',                     NULL,                                           'Hr',    NULL,                          85.00, 'Labour'),
( 8, 'Plant Operator',             NULL,                                           'Hr',    NULL,                          95.00, 'Labour'),
( 9, 'Supervisor',                 NULL,                                           'Hr',    NULL,                         110.00, 'Labour'),
(10, '2 Person Crew - Weekday',    'Stop/slow, includes signage set',              'Hr',    'Clearway Traffic Services',   95.00, 'Traffic'),
(11, 'Portable Traffic Light',     'Pair, solar, remote linked',                   'Day',   'Clearway Traffic Services',  180.00, 'Traffic'),
(12, 'TC Travel',                  NULL,                                           'Ea',    'Clearway Traffic Services',  120.00, 'Traffic'),
(13, 'DGB20 (Delivered)',          'Delivered to site',                            'Tonne', 'Ironbark Quarries',           42.00, 'Materials'),
(14, 'Drainage Rock',              '40-70mm clean',                                'Tonne', 'Ironbark Quarries',           38.00, 'Materials'),
(15, 'Select Fill',                NULL,                                           'Tonne', 'Ironbark Quarries',           28.00, 'Materials'),
(16, 'Concrete 32MPa',            '20mm agg, 80 slump',                           'm3',    'Valley Concrete Supply',     275.00, 'Materials'),
(17, 'Concrete 25MPa',            '20mm agg, 80 slump',                           'm3',    'Valley Concrete Supply',     255.00, 'Materials'),
(18, 'Environmental Consultant',   NULL,                                           'Hr',    'Greenfield Environmental',   145.00, 'Professional'),
(19, 'Erosion Control',            'Sediment fence + coir logs per SWMP',          'LS',    'Greenfield Environmental',  3200.00, 'Environmental'),
(20, 'Centre Line',                'Thermoplastic, 100mm',                         'm',     'Dawson Line Marking',          1.80, 'Line Marking'),
(21, 'Edge Line',                  'Thermoplastic, 100mm',                         'm',     'Dawson Line Marking',          1.50, 'Line Marking'),
(22, 'Mobilisation',               NULL,                                           'LS',    NULL,                        8500.00, 'Preliminaries'),
(23, '10T Tipper (Blacksoil)',     'Hino FM tandem, wet hire',                     'Hr',    'Blacksoil Earthmoving',      130.00, 'Plant'),
(24, '20T Excavator (Blacksoil)',  'Cat 320, tilt hitch + augers, wet hire',       'Hr',    'Blacksoil Earthmoving',      230.00, 'Plant'),
(25, '20T Excavator (Hawk)',       'Volvo EC220, rubber tracked, long arm',        'Hr',    'Hawkridge Constructions',    225.00, 'Plant'),
(26, 'Dozer',                      'Cat D6 XE, slope assist, wet hire',            'Hr',    'Blacksoil Earthmoving',      265.00, 'Plant'),
(27, 'Padfoot Roller',             'Ammann 12t padfoot drum, wet hire',            'Day',   'Tablelands Equipment Hire',  320.00, 'Plant'),
(28, 'Skid Steer',                 'Cat 246, 4-in-1 bucket + broom attachment',    'Hr',    'Hawkridge Constructions',    130.00, 'Plant'),
(29, '5T Excavator',               'Kubota KX057, rubber tracked, tilt bucket',    'Hr',    'Hawkridge Constructions',    135.00, 'Plant'),
(30, 'Semi Side Tipper',           'Kenworth + Hercules side tipper, 28t payload', 'Hr',    'Blacksoil Earthmoving',      165.00, 'Plant'),
(31, 'Concrete Pump',              'Boom pump 32m, incl. operator',                'Hr',    'Valley Concrete Supply',     195.00, 'Plant'),
(32, 'Light Tower',                'Solar/diesel hybrid, 4-mast LED',              'Day',   'Tablelands Equipment Hire',   85.00, 'Plant'),
(33, 'Street Sweeper',             'Truck mounted, incl. operator',                'Hr',    'Tablelands Equipment Hire',  165.00, 'Plant'),
(34, 'Vac Truck (NDD)',            '3000L hydro excavation, 2 operators',          'Hr',    'Hawkridge Constructions',    280.00, 'Plant'),
(35, 'Float Transport',            'Low loader to 35t, incl. pilot vehicle',       'Hr',    'Big River Haulage',          185.00, 'Transport'),
(36, 'Leading Hand',               NULL,                                           'Hr',    NULL,                         100.00, 'Labour'),
(37, 'Pipelayer',                  'Incl. pipe laser certification',               'Hr',    NULL,                          98.00, 'Labour'),
(38, '2 Person Crew - Night',      'Stop/slow, after-hours rates',                 'Hr',    'Clearway Traffic Services',  130.00, 'Traffic'),
(39, 'TMP Preparation',            'Traffic management plan incl. permits',        'Ea',    'Clearway Traffic Services',  850.00, 'Traffic'),
(40, 'AC14 Asphalt (Supplied)',    'Dense grade base course, ex plant',            'Tonne', 'Westvale Asphalt Pty Ltd',   215.00, 'Asphalt'),
(41, 'AC10 Asphalt (Supplied)',    'Dense grade wearing course, ex plant',         'Tonne', 'Westvale Asphalt Pty Ltd',   228.00, 'Asphalt'),
(42, 'Tack Coat Emulsion',         'CRS bitumen emulsion, applied',                'L',     'Westvale Asphalt Pty Ltd',     1.10, 'Asphalt'),
(43, 'Geotextile',                 'Bidim A34 or equivalent, 2m rolls',            'm2',    'Ironbark Quarries',            4.50, 'Materials'),
(44, '450 RCP Class 4',            'Spigot and socket, rubber ring joint',         'm',     'Monaro Precast & Pipe',      410.00, 'Drainage'),
(45, '375 RCP Class 4',            'Spigot and socket, rubber ring joint',         'm',     'Monaro Precast & Pipe',      330.00, 'Drainage'),
(46, '450 Precast Headwall',       'To suit 450 RCP, incl. lifting anchors',       'Ea',    'Monaro Precast & Pipe',      950.00, 'Drainage'),
(47, 'Survey Set-out Crew',        '2 person, GPS + total station',                'Hr',    'Riverbend Survey & Spatial', 230.00, 'Survey & Testing'),
(48, 'Field Density Test',         'Nuclear gauge, NATA accredited',               'Ea',    'Tablelands Geotech',          85.00, 'Survey & Testing');

-- Demo dockets for Warrawong Road.
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
