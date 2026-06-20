-- ============================================================================
-- DCT-OS Demo Seed Data
-- ============================================================================
-- Fictional "Riverbend Shire Council" dataset for demonstration.
-- All names, values, and dates are synthetic.
--
-- This seeds a road-rehabilitation job roughly three-quarters of the way
-- through: budgets are set close to the spend so the dashboard reads like a
-- live project — a real spend-over-time S-curve, cost-code burn-down bars
-- across the green/amber/red range, and most of the early work already
-- claimed (the green, marked-off rows in the dockets tracker). Dockets run
-- weekly from mobilisation to the wearing course; the last few (late April
-- onward) are entered but not yet claimed.
-- ============================================================================

-- Projects
INSERT INTO projects (id, name, code, client, start_date, end_date, status) VALUES
(1, 'Warrawong Road Rehabilitation', 'RSC-2025-001', 'Riverbend Shire Council', '2025-01-10', '2025-06-30', 'Active');

-- Cost Codes (budgets sized to the spend so the burn-down tells a story:
-- drainage is slightly over, mobilisation nearly fully drawn, the rest tracking)
INSERT INTO cost_codes (id, project_id, code, description, budget_amount) VALUES
( 1, 1, 'CC101', 'Mobilisation',          19000.00),
( 2, 1, 'CC102', 'Earthworks',            72000.00),
( 3, 1, 'CC103', 'Pavement Construction', 95000.00),
( 4, 1, 'CC104', 'Spray Seal & Asphalt',  70000.00),
( 5, 1, 'CC105', 'Drainage Works',        29000.00),
( 6, 1, 'CC106', 'Traffic Management',    28000.00),
( 7, 1, 'CC107', 'Line Marking',          15000.00),
( 8, 1, 'CC108', 'Environmental',          9000.00),
( 9, 1, 'CC109', 'Road Furniture',        12000.00),
(10, 1, 'CC110', 'Demobilisation',        10000.00);

-- Work Orders
INSERT INTO work_orders (id, project_id, number, description, status) VALUES
( 1, 1, 'W2500101', 'Mobilisation',          'Active'),
( 2, 1, 'W2500102', 'Earthworks',            'Active'),
( 3, 1, 'W2500103', 'Pavement Construction', 'Active'),
( 4, 1, 'W2500105', 'Drainage Works',        'Active'),
( 5, 1, 'W2500106', 'Traffic Management',    'Active'),
( 6, 1, 'W2500107', 'Line Marking',          'Active'),
( 7, 1, 'W2500108', 'Environmental',         'Active');

-- Purchase Orders (values sized so the PO-drawdown panel reads ~75-90% drawn)
INSERT INTO purchase_orders (id, project_id, number, supplier_name, value, raised_date, is_active) VALUES
( 1, 1, '45201', 'Redgum Civil Pty Ltd',       78000.00, '2025-01-12', 1),
( 2, 1, '45202', 'Blacksoil Earthmoving',      24000.00, '2025-01-15', 1),
( 3, 1, '45203', 'Clearway Traffic Services',  24000.00, '2025-01-15', 1),
( 4, 1, '45204', 'Ironbark Quarries',          72000.00, '2025-01-18', 1),
( 5, 1, '45205', 'Tablelands Equipment Hire',   7500.00, '2025-01-22', 1),
( 6, 1, '45206', 'Dawson Line Marking',        14000.00, '2025-03-10', 1),
( 7, 1, '45207', 'Valley Concrete Supply',      7000.00, '2025-02-01', 1),
( 8, 1, '45208', 'Greenfield Environmental',    9000.00, '2025-01-28', 1),
( 9, 1, '45209', 'Westvale Asphalt Pty Ltd',   64000.00, '2025-03-18', 1),
(10, 1, '45210', 'Monaro Precast & Pipe',      20000.00, '2025-02-05', 1);

-- WO <-> Cost Code matrix (which CCs are valid for each WO)
INSERT INTO wo_cost_codes (work_order_id, cost_code_id) VALUES
(1, 1), (2, 2), (3, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8);

-- PO <-> WO assignments (which POs fund which WOs)
INSERT INTO po_assignments (purchase_order_id, work_order_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 2),
(3, 5),
(4, 2), (4, 3), (4, 4),
(5, 2), (5, 3),
(6, 6),
(7, 4),
(8, 7),
(9, 3),
(10, 4);

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

-- ============================================================================
-- Dockets. Headers are inserted in date order so the auto-increment id matches
-- the docket_id referenced by the lines below (1..38). Amounts are written as
-- qty * rate so they always reconcile. Early progress claims (PC-01..PC-04)
-- are marked claimed; dockets from mid-April on are entered but not yet claimed.
-- ============================================================================

-- Progress Claim 01 — January (claimed)
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes, claimed_reference, claimed_at) VALUES
(1,    1, 'Redgum Civil Pty Ltd',       '2025-01-13', 'RGC-0001', 'Site establishment and mobilisation',          'PC-01', '2025-02-21'),
(1,    1, 'Redgum Civil Pty Ltd',       '2025-01-15', 'RGC-0002', 'Site compound, access track and set-out',      'PC-01', '2025-02-21'),
(1, NULL, 'Riverbend Survey & Spatial', '2025-01-16', 'SS-1001',  'Survey control and initial set-out',           'PC-01', '2025-02-21'),
(1,    3, 'Clearway Traffic Services',  '2025-01-17', 'CTS-0040', 'TMP setup, permits and signage',               'PC-01', '2025-02-21'),
(1,    1, 'Redgum Civil Pty Ltd',       '2025-01-20', 'RGC-0004', 'Bulk earthworks - cut to fill',                'PC-01', '2025-02-21'),
(1,    2, 'Blacksoil Earthmoving',      '2025-01-22', 'BSE-0010', 'Earthworks - dozer push, side-tip haul',       'PC-01', '2025-02-21'),
(1,    1, 'Redgum Civil Pty Ltd',       '2025-01-24', 'RGC-0005', 'Cut to subgrade, batter trim',                 'PC-01', '2025-02-21'),
(1,    4, 'Ironbark Quarries',          '2025-01-27', 'IQ-2301',  'Select fill delivered to fill zones',          'PC-01', '2025-02-21'),
(1,    5, 'Tablelands Equipment Hire',  '2025-01-29', 'TEH-0080', 'Compaction - padfoot roller and water cart',   'PC-01', '2025-02-21'),
(1,    3, 'Clearway Traffic Services',  '2025-01-30', 'CTS-0042', 'Traffic management - week ending 31 Jan',      'PC-01', '2025-02-21');

-- Progress Claim 02 — February (claimed)
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes, claimed_reference, claimed_at) VALUES
(1,    1, 'Redgum Civil Pty Ltd',     '2025-02-03', 'RGC-0006', 'Earthworks - trim and proof roll',            'PC-02', '2025-03-21'),
(1,    2, 'Blacksoil Earthmoving',    '2025-02-05', 'BSE-0011', 'Bulk earthworks continued',                   'PC-02', '2025-03-21'),
(1,    4, 'Ironbark Quarries',        '2025-02-07', 'IQ-2305',  'Select fill - second zone',                   'PC-02', '2025-03-21'),
(1,   10, 'Monaro Precast & Pipe',    '2025-02-10', 'MPP-0301', 'Stormwater pipe and headwall delivery',       'PC-02', '2025-03-21'),
(1,    1, 'Redgum Civil Pty Ltd',     '2025-02-12', 'RGC-0008', 'Drainage trench excavation and pipelaying',   'PC-02', '2025-03-21'),
(1,    4, 'Ironbark Quarries',        '2025-02-14', 'IQ-2310',  'Drainage rock and pipe bedding',              'PC-02', '2025-03-21'),
(1,    1, 'Redgum Civil Pty Ltd',     '2025-02-17', 'RGC-0010', 'Subgrade preparation ch.200-450',             'PC-02', '2025-03-21'),
(1,    7, 'Valley Concrete Supply',   '2025-02-19', 'VCS-0200', 'Drainage structures - headwall pour',         'PC-02', '2025-03-21'),
(1,    4, 'Ironbark Quarries',        '2025-02-21', 'IQ-2316',  'DGB20 pavement base delivered',               'PC-02', '2025-03-21'),
(1,    1, 'Redgum Civil Pty Ltd',     '2025-02-24', 'RGC-0011', 'Pavement - place and trim base ch.0-300',     'PC-02', '2025-03-21'),
(1,    8, 'Greenfield Environmental', '2025-02-26', 'GFE-0001', 'Environmental inspection and erosion control', 'PC-02', '2025-03-21'),
(1,    2, 'Blacksoil Earthmoving',    '2025-02-28', 'BSE-0013', 'Earthworks - final cut zones',                'PC-02', '2025-03-21');

-- Progress Claim 03 — March (claimed)
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes, claimed_reference, claimed_at) VALUES
(1,    4, 'Ironbark Quarries',         '2025-03-04', 'IQ-2320',  'DGB20 base - second lift',                    'PC-03', '2025-04-22'),
(1,    1, 'Redgum Civil Pty Ltd',      '2025-03-06', 'RGC-0014', 'Pavement base place and compact ch.300-600',  'PC-03', '2025-04-22'),
(1,    5, 'Tablelands Equipment Hire', '2025-03-10', 'TEH-0086', 'Compaction and density testing support',      'PC-03', '2025-04-22'),
(1,    4, 'Ironbark Quarries',         '2025-03-12', 'IQ-2326',  'DGB20 base ch.600-end',                       'PC-03', '2025-04-22'),
(1,    1, 'Redgum Civil Pty Ltd',      '2025-03-14', 'RGC-0017', 'Pavement trim and proof roll - full length',  'PC-03', '2025-04-22'),
(1,    3, 'Clearway Traffic Services', '2025-03-19', 'CTS-0050', 'Traffic management - March',                  'PC-03', '2025-04-22'),
(1,    8, 'Greenfield Environmental',  '2025-03-21', 'GFE-0004', 'Environmental monitoring',                    'PC-03', '2025-04-22'),
(1,    9, 'Westvale Asphalt Pty Ltd',  '2025-03-26', 'WVA-0401', 'Prime/tack coat and AC14 base - stage 1',     'PC-03', '2025-04-22'),
(1,    1, 'Redgum Civil Pty Ltd',      '2025-03-28', 'RGC-0019', 'Asphalt support and pavement repairs',        'PC-03', '2025-04-22');

-- Progress Claim 04 — early April (claimed)
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes, claimed_reference, claimed_at) VALUES
(1,    9, 'Westvale Asphalt Pty Ltd',  '2025-04-02', 'WVA-0405', 'AC10 wearing course - stage 1',               'PC-04', '2025-05-22'),
(1,    4, 'Ironbark Quarries',         '2025-04-08', 'IQ-2335',  'Pavement materials - shoulders',              'PC-04', '2025-05-22'),
(1,    5, 'Tablelands Equipment Hire', '2025-04-11', 'TEH-0090', 'Street sweep and light towers',               'PC-04', '2025-05-22');

-- Not yet claimed — mid-April onward (entered, awaiting next progress claim)
INSERT INTO docket_headers (project_id, purchase_order_id, supplier_name, date, docket_number, notes) VALUES
(1,    9, 'Westvale Asphalt Pty Ltd',  '2025-04-23', 'WVA-0409', 'AC10 wearing course - stage 2'),
(1,    3, 'Clearway Traffic Services', '2025-04-29', 'CTS-0058', 'Traffic management - late April (night works)'),
(1,    1, 'Redgum Civil Pty Ltd',      '2025-05-06', 'RGC-0020', 'Punch-list pavement repairs and cleanup'),
(1,    8, 'Greenfield Environmental',  '2025-05-13', 'GFE-0006', 'Environmental - pre-handover audit');

-- Docket lines (docket_id matches the header insertion order above).
INSERT INTO docket_lines (docket_id, work_order_id, cost_code_id, resource_id, qty, unit, rate, amount, sort_order) VALUES
-- 1  Mobilisation
( 1, 1, 1, 22,   1, 'LS',    8500.00,   1*8500.00, 0),
-- 2  Site compound + set-out
( 2, 1, 1,  1,   6, 'Hr',     220.00,    6*220.00, 0),
( 2, 1, 1,  6,   4, 'Hr',     185.00,    4*185.00, 1),
( 2, 1, 1,  7,  24, 'Hr',      85.00,   24*85.00,  2),
( 2, 1, 1, 36,   8, 'Hr',     100.00,    8*100.00, 3),
-- 3  Survey control
( 3, 1, 1, 47,  14, 'Hr',     230.00,   14*230.00, 0),
-- 4  Traffic setup
( 4, 5, 6, 39,   1, 'Ea',     850.00,    1*850.00, 0),
( 4, 5, 6, 10,   8, 'Hr',      95.00,    8*95.00,  1),
( 4, 5, 6, 11,   2, 'Day',    180.00,    2*180.00, 2),
-- 5  Earthworks cut to fill
( 5, 2, 2,  1,   9, 'Hr',     220.00,    9*220.00, 0),
( 5, 2, 2,  2,   9, 'Hr',     125.00,    9*125.00, 1),
( 5, 2, 2,  3,   6, 'Hr',     235.00,    6*235.00, 2),
( 5, 2, 2,  7,   9, 'Hr',      85.00,    9*85.00,  3),
-- 6  Blacksoil dozer push
( 6, 2, 2, 26,   8, 'Hr',     265.00,    8*265.00, 0),
( 6, 2, 2, 30,   8, 'Hr',     165.00,    8*165.00, 1),
( 6, 2, 2, 24,   8, 'Hr',     230.00,    8*230.00, 2),
-- 7  Cut to subgrade
( 7, 2, 2,  1,   9, 'Hr',     220.00,    9*220.00, 0),
( 7, 2, 2,  2,   8, 'Hr',     125.00,    8*125.00, 1),
( 7, 2, 2,  8,   9, 'Hr',      95.00,    9*95.00,  2),
( 7, 2, 2,  7,   9, 'Hr',      85.00,    9*85.00,  3),
-- 8  Select fill
( 8, 2, 2, 15, 180, 'Tonne',   28.00,  180*28.00,  0),
-- 9  Compaction
( 9, 2, 2, 27,   1, 'Day',    320.00,    1*320.00, 0),
( 9, 2, 2,  5,   8, 'Hr',     160.00,    8*160.00, 1),
( 9, 2, 2,  4,   1, 'Day',    280.00,    1*280.00, 2),
-- 10 Traffic management week
(10, 5, 6, 10,  38, 'Hr',      95.00,   38*95.00,  0),
(10, 5, 6, 12,   2, 'Ea',     120.00,    2*120.00, 1),
-- 11 Earthworks trim + proof roll
(11, 2, 2,  3,   8, 'Hr',     235.00,    8*235.00, 0),
(11, 2, 2,  4,   1, 'Day',    280.00,    1*280.00, 1),
(11, 2, 2,  5,   6, 'Hr',     160.00,    6*160.00, 2),
(11, 2, 2,  7,   8, 'Hr',      85.00,    8*85.00,  3),
-- 12 Bulk earthworks continued
(12, 2, 2, 24,  10, 'Hr',     230.00,   10*230.00, 0),
(12, 2, 2, 23,   9, 'Hr',     130.00,    9*130.00, 1),
(12, 2, 2, 26,   6, 'Hr',     265.00,    6*265.00, 2),
-- 13 Select fill second zone
(13, 2, 2, 15, 220, 'Tonne',   28.00,  220*28.00,  0),
-- 14 Pipe + headwall delivery
(14, 4, 5, 44,  36, 'm',      410.00,   36*410.00, 0),
(14, 4, 5, 46,   2, 'Ea',     950.00,    2*950.00, 1),
-- 15 Drainage trench + pipelaying
(15, 4, 5,  1,   8, 'Hr',     220.00,    8*220.00, 0),
(15, 4, 5, 37,   9, 'Hr',      98.00,    9*98.00,  1),
(15, 4, 5,  7,   9, 'Hr',      85.00,    9*85.00,  2),
(15, 4, 5,  6,   4, 'Hr',     185.00,    4*185.00, 3),
-- 16 Drainage rock + bedding
(16, 4, 5, 14,  60, 'Tonne',   38.00,   60*38.00,  0),
(16, 4, 5, 13,  40, 'Tonne',   42.00,   40*42.00,  1),
-- 17 Subgrade prep
(17, 2, 2,  1,  10, 'Hr',     220.00,   10*220.00, 0),
(17, 2, 2,  2,   9, 'Hr',     125.00,    9*125.00, 1),
(17, 2, 2,  3,   6, 'Hr',     235.00,    6*235.00, 2),
-- 18 Drainage structures pour
(18, 4, 5, 16,   8, 'm3',     275.00,    8*275.00, 0),
(18, 4, 5, 31,   5, 'Hr',     195.00,    5*195.00, 1),
-- 19 DGB20 base delivered
(19, 3, 3, 13, 240, 'Tonne',   42.00,  240*42.00,  0),
-- 20 Pavement place + trim
(20, 3, 3,  3,  10, 'Hr',     235.00,   10*235.00, 0),
(20, 3, 3,  6,   6, 'Hr',     185.00,    6*185.00, 1),
(20, 3, 3,  4,   1, 'Day',    280.00,    1*280.00, 2),
(20, 3, 3,  5,   8, 'Hr',     160.00,    8*160.00, 3),
(20, 3, 3,  7,   9, 'Hr',      85.00,    9*85.00,  4),
-- 21 Environmental inspection
(21, 7, 8, 18,   8, 'Hr',     145.00,    8*145.00, 0),
(21, 7, 8, 19,   1, 'LS',    3200.00,   1*3200.00, 1),
-- 22 Earthworks final cut
(22, 2, 2, 24,  12, 'Hr',     230.00,   12*230.00, 0),
(22, 2, 2, 23,  10, 'Hr',     130.00,   10*130.00, 1),
(22, 2, 2, 26,   6, 'Hr',     265.00,    6*265.00, 2),
-- 23 DGB20 second lift
(23, 3, 3, 13, 280, 'Tonne',   42.00,  280*42.00,  0),
-- 24 Pavement base place + compact
(24, 3, 3,  3,  10, 'Hr',     235.00,   10*235.00, 0),
(24, 3, 3,  6,   6, 'Hr',     185.00,    6*185.00, 1),
(24, 3, 3,  4,   2, 'Day',    280.00,    2*280.00, 2),
(24, 3, 3,  5,   8, 'Hr',     160.00,    8*160.00, 3),
(24, 3, 3,  7,   9, 'Hr',      85.00,    9*85.00,  4),
-- 25 Compaction + density testing
(25, 3, 3, 27,   2, 'Day',    320.00,    2*320.00, 0),
(25, 3, 3,  5,   8, 'Hr',     160.00,    8*160.00, 1),
(25, 3, 3, 48,  10, 'Ea',      85.00,   10*85.00,  2),
-- 26 DGB20 base to end
(26, 3, 3, 13, 300, 'Tonne',   42.00,  300*42.00,  0),
-- 27 Pavement trim + proof roll full length
(27, 3, 3,  3,  12, 'Hr',     235.00,   12*235.00, 0),
(27, 3, 3,  4,   2, 'Day',    280.00,    2*280.00, 1),
(27, 3, 3,  5,  10, 'Hr',     160.00,   10*160.00, 2),
(27, 3, 3,  7,   9, 'Hr',      85.00,    9*85.00,  3),
-- 28 Traffic management March
(28, 5, 6, 10,  60, 'Hr',      95.00,   60*95.00,  0),
(28, 5, 6, 11,   4, 'Day',    180.00,    4*180.00, 1),
(28, 5, 6, 12,   2, 'Ea',     120.00,    2*120.00, 2),
-- 29 Environmental monitoring
(29, 7, 8, 18,  12, 'Hr',     145.00,   12*145.00, 0),
-- 30 Prime/tack + AC14 base
(30, 3, 4, 42, 4000, 'L',       1.10, 4000*1.10,   0),
(30, 3, 4, 40,  60, 'Tonne',   215.00,  60*215.00, 1),
-- 31 Asphalt support + repairs
(31, 3, 3,  1,   8, 'Hr',     220.00,    8*220.00, 0),
(31, 3, 3,  6,   6, 'Hr',     185.00,    6*185.00, 1),
(31, 3, 3,  7,   9, 'Hr',      85.00,    9*85.00,  2),
-- 32 AC10 wearing course stage 1
(32, 3, 4, 41,  70, 'Tonne',   228.00,  70*228.00, 0),
(32, 3, 4, 42, 2000, 'L',       1.10, 2000*1.10,   1),
-- 33 Pavement materials shoulders
(33, 3, 3, 13, 120, 'Tonne',   42.00,  120*42.00,  0),
(33, 3, 3, 15,  60, 'Tonne',   28.00,   60*28.00,  1),
-- 34 Street sweep + light towers
(34, 5, 6, 33,   6, 'Hr',     165.00,    6*165.00, 0),
(34, 5, 6, 32,   2, 'Day',     85.00,    2*85.00,  1),
-- 35 AC10 wearing course stage 2 (unclaimed)
(35, 3, 4, 41,  65, 'Tonne',   228.00,  65*228.00, 0),
(35, 3, 4, 42, 1800, 'L',       1.10, 1800*1.10,   1),
-- 36 Traffic management late April (unclaimed)
(36, 5, 6, 10,  50, 'Hr',      95.00,   50*95.00,  0),
(36, 5, 6, 38,  12, 'Hr',     130.00,   12*130.00, 1),
(36, 5, 6, 12,   2, 'Ea',     120.00,    2*120.00, 2),
-- 37 Punch-list repairs + cleanup (unclaimed)
(37, 3, 3,  1,   6, 'Hr',     220.00,    6*220.00, 0),
(37, 3, 3,  7,  16, 'Hr',      85.00,   16*85.00,  1),
(37, 3, 3, 28,   6, 'Hr',     130.00,    6*130.00, 2),
-- 38 Environmental pre-handover audit (unclaimed)
(38, 7, 8, 18,   6, 'Hr',     145.00,    6*145.00, 0);

-- The lines above were written without a per-line description. Pull each
-- line's description from its resource's Description (make/model detail) so the
-- demo reflects how docket entry now auto-fills it. Lines whose resource has no
-- detail (Labour, Mobilisation, etc.) stay blank — the Item still shows in the
-- Resource column.
UPDATE docket_lines
SET description = (SELECT details FROM resources WHERE resources.id = docket_lines.resource_id)
WHERE resource_id IS NOT NULL;

-- Populate the suppliers reference table from the seeded names (migration 003
-- backfills existing databases; this covers a fresh seed where the migration
-- ran before any data existed).
INSERT OR IGNORE INTO suppliers (name)
SELECT DISTINCT name FROM (
    SELECT supplier_name AS name FROM purchase_orders
        WHERE supplier_name IS NOT NULL AND TRIM(supplier_name) <> ''
    UNION SELECT supplier_name FROM docket_headers
        WHERE supplier_name IS NOT NULL AND TRIM(supplier_name) <> ''
    UNION SELECT supplier_name FROM resources
        WHERE supplier_name IS NOT NULL AND TRIM(supplier_name) <> ''
);
