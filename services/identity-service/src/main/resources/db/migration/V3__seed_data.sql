-- ============================================
-- SEED CATEGORIES
-- ============================================

INSERT INTO categories (id, name, slug, description, icon_url, color_code, is_active, display_order) VALUES
(uuid_generate_v4(), 'Plumbing', 'plumbing', 'Fix leaks, install fixtures, and solve all plumbing issues', 'https://cdn.helpinminutes.com/icons/plumbing.svg', '#2196F3', true, 1),
(uuid_generate_v4(), 'Electrical', 'electrical', 'Wiring, installations, and electrical repairs', 'https://cdn.helpinminutes.com/icons/electrical.svg', '#FFC107', true, 2),
(uuid_generate_v4(), 'Cleaning', 'cleaning', 'Home and office cleaning services', 'https://cdn.helpinminutes.com/icons/cleaning.svg', '#4CAF50', true, 3),
(uuid_generate_v4(), 'Moving & Packing', 'moving-packing', 'Professional moving and packing services', 'https://cdn.helpinminutes.com/icons/moving.svg', '#9C27B0', true, 4),
(uuid_generate_v4(), 'Appliance Repair', 'appliance-repair', 'Repair services for home appliances', 'https://cdn.helpinminutes.com/icons/appliance.svg', '#FF5722', true, 5),
(uuid_generate_v4(), 'Carpentry', 'carpentry', 'Woodwork, furniture repair, and custom carpentry', 'https://cdn.helpinminutes.com/icons/carpentry.svg', '#795548', true, 6),
(uuid_generate_v4(), 'Painting', 'painting', 'Interior and exterior painting services', 'https://cdn.helpinminutes.com/icons/painting.svg', '#E91E63', true, 7),
(uuid_generate_v4(), 'Pest Control', 'pest-control', 'Professional pest control and extermination', 'https://cdn.helpinminutes.com/icons/pest.svg', '#8BC34A', true, 8),
(uuid_generate_v4(), 'Gardening', 'gardening', 'Lawn care, landscaping, and garden maintenance', 'https://cdn.helpinminutes.com/icons/gardening.svg', '#009688', true, 9),
(uuid_generate_v4(), 'Computer & Tech', 'computer-tech', 'IT support, repairs, and tech assistance', 'https://cdn.helpinminutes.com/icons/tech.svg', '#607D8B', true, 10);

-- ============================================
-- SEED SKILLS FOR PLUMBING
-- ============================================

DO $$
DECLARE
    plumbing_id UUID;
    electrical_id UUID;
    cleaning_id UUID;
    moving_id UUID;
    appliance_id UUID;
    carpentry_id UUID;
    painting_id UUID;
    pest_id UUID;
    gardening_id UUID;
    tech_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO plumbing_id FROM categories WHERE slug = 'plumbing';
    SELECT id INTO electrical_id FROM categories WHERE slug = 'electrical';
    SELECT id INTO cleaning_id FROM categories WHERE slug = 'cleaning';
    SELECT id INTO moving_id FROM categories WHERE slug = 'moving-packing';
    SELECT id INTO appliance_id FROM categories WHERE slug = 'appliance-repair';
    SELECT id INTO carpentry_id FROM categories WHERE slug = 'carpentry';
    SELECT id INTO painting_id FROM categories WHERE slug = 'painting';
    SELECT id INTO pest_id FROM categories WHERE slug = 'pest-control';
    SELECT id INTO gardening_id FROM categories WHERE slug = 'gardening';
    SELECT id INTO tech_id FROM categories WHERE slug = 'computer-tech';

    -- Plumbing Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Leak Repair', 'leak-repair', 'Fix leaking pipes, taps, and fixtures', plumbing_id, true, 1, 60, 500.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Tap Installation', 'tap-installation', 'Install new taps and faucets', plumbing_id, true, 2, 45, 400.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Toilet Repair', 'toilet-repair', 'Fix toilet flush, leaks, and blockages', plumbing_id, true, 3, 60, 450.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Pipe Installation', 'pipe-installation', 'Install new water pipes and lines', plumbing_id, true, 4, 120, 600.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Water Heater Service', 'water-heater-service', 'Repair and service water heaters', plumbing_id, true, 5, 90, 550.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Drain Cleaning', 'drain-cleaning', 'Clear clogged drains and pipes', plumbing_id, true, 6, 60, 400.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Bathroom Fitting', 'bathroom-fitting', 'Install bathroom accessories and fixtures', plumbing_id, true, 7, 120, 500.00, 'per_hour', true, true);

    -- Electrical Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Wiring Installation', 'wiring-installation', 'New electrical wiring and rewiring', electrical_id, true, 1, 180, 800.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Switch & Socket Repair', 'switch-socket-repair', 'Repair or replace switches and sockets', electrical_id, true, 2, 45, 350.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Fan Installation', 'fan-installation', 'Install ceiling and exhaust fans', electrical_id, true, 3, 60, 400.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Light Fixture Installation', 'light-fixture-installation', 'Install lights and fixtures', electrical_id, true, 4, 60, 400.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Circuit Breaker Repair', 'circuit-breaker-repair', 'Repair and replace circuit breakers', electrical_id, true, 5, 90, 600.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Inverter Service', 'inverter-service', 'Install and repair inverters', electrical_id, true, 6, 120, 700.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Electrical Inspection', 'electrical-inspection', 'Safety inspection and certification', electrical_id, true, 7, 60, 500.00, 'fixed', true, false);

    -- Cleaning Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Deep Home Cleaning', 'deep-home-cleaning', 'Thorough cleaning of entire home', cleaning_id, true, 1, 240, 1500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Kitchen Cleaning', 'kitchen-cleaning', 'Deep clean kitchen and appliances', cleaning_id, true, 2, 120, 800.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Bathroom Cleaning', 'bathroom-cleaning', 'Sanitize and clean bathrooms', cleaning_id, true, 3, 90, 600.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Sofa Cleaning', 'sofa-cleaning', 'Professional sofa and upholstery cleaning', cleaning_id, true, 4, 90, 500.00, 'per_piece', true, true),
    (uuid_generate_v4(), 'Carpet Cleaning', 'carpet-cleaning', 'Deep carpet and rug cleaning', cleaning_id, true, 5, 60, 400.00, 'per_piece', true, true),
    (uuid_generate_v4(), 'Office Cleaning', 'office-cleaning', 'Commercial office cleaning services', cleaning_id, true, 6, 180, 2000.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Post-Construction Cleaning', 'post-construction-cleaning', 'Clean up after construction work', cleaning_id, true, 7, 300, 3000.00, 'fixed', true, true);

    -- Moving & Packing Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Local Home Shifting', 'local-home-shifting', 'Move within the city', moving_id, true, 1, 300, 2500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Intercity Moving', 'intercity-moving', 'Long distance moving services', moving_id, true, 2, 600, 8000.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Packing Service', 'packing-service', 'Professional packing of household items', moving_id, true, 3, 180, 1500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Furniture Disassembly', 'furniture-disassembly', 'Dismantle furniture for moving', moving_id, true, 4, 120, 800.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Vehicle Transportation', 'vehicle-transportation', 'Transport cars and bikes', moving_id, true, 5, 480, 5000.00, 'fixed', true, false),
    (uuid_generate_v4(), 'Office Relocation', 'office-relocation', 'Commercial moving services', moving_id, true, 6, 480, 10000.00, 'fixed', true, true);

    -- Appliance Repair Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'AC Service & Repair', 'ac-service-repair', 'Air conditioner maintenance and repair', appliance_id, true, 1, 90, 800.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Refrigerator Repair', 'refrigerator-repair', 'Fix cooling issues and leaks', appliance_id, true, 2, 90, 700.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Washing Machine Repair', 'washing-machine-repair', 'Repair all types of washing machines', appliance_id, true, 3, 90, 650.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Microwave Repair', 'microwave-repair', 'Fix microwave heating issues', appliance_id, true, 4, 60, 500.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'TV Installation', 'tv-installation', 'Mount and setup televisions', appliance_id, true, 5, 60, 500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Geyser Repair', 'geyser-repair', 'Water heater repair and service', appliance_id, true, 6, 75, 550.00, 'per_hour', true, true);

    -- Carpentry Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Furniture Repair', 'furniture-repair', 'Fix broken furniture', carpentry_id, true, 1, 120, 600.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Door & Window Repair', 'door-window-repair', 'Fix doors, windows, and frames', carpentry_id, true, 2, 90, 550.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Custom Shelving', 'custom-shelving', 'Build custom shelves and storage', carpentry_id, true, 3, 180, 700.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Bed Assembly', 'bed-assembly', 'Assemble beds and furniture', carpentry_id, true, 4, 90, 500.00, 'fixed', true, false),
    (uuid_generate_v4(), 'Cabinet Making', 'cabinet-making', 'Build custom cabinets', carpentry_id, true, 5, 300, 800.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Wood Polishing', 'wood-polishing', 'Polish and refinish wood surfaces', carpentry_id, true, 6, 120, 600.00, 'per_hour', true, true);

    -- Painting Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Interior Painting', 'interior-painting', 'Paint walls and ceilings inside', painting_id, true, 1, 480, 25.00, 'per_sqft', true, true),
    (uuid_generate_v4(), 'Exterior Painting', 'exterior-painting', 'Paint building exterior', painting_id, true, 2, 600, 30.00, 'per_sqft', true, true),
    (uuid_generate_v4(), 'Texture Painting', 'texture-painting', 'Decorative texture finishes', painting_id, true, 3, 360, 50.00, 'per_sqft', true, true),
    (uuid_generate_v4(), 'Wood Painting', 'wood-painting', 'Paint doors, windows, furniture', painting_id, true, 4, 240, 40.00, 'per_sqft', true, true),
    (uuid_generate_v4(), 'Waterproofing', 'waterproofing', 'Waterproof coating application', painting_id, true, 5, 360, 60.00, 'per_sqft', true, true);

    -- Pest Control Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Cockroach Control', 'cockroach-control', 'Eliminate cockroach infestation', pest_id, true, 1, 60, 800.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Termite Control', 'termite-control', 'Termite treatment and prevention', pest_id, true, 2, 120, 2500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Bed Bug Treatment', 'bed-bug-treatment', 'Remove bed bugs from home', pest_id, true, 3, 90, 1500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Mosquito Control', 'mosquito-control', 'Mosquito fogging and treatment', pest_id, true, 4, 45, 600.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Rodent Control', 'rodent-control', 'Rat and mice control services', pest_id, true, 5, 60, 1000.00, 'fixed', true, true),
    (uuid_generate_v4(), 'General Pest Control', 'general-pest-control', 'Complete home pest control', pest_id, true, 6, 90, 1200.00, 'fixed', true, true);

    -- Gardening Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Lawn Mowing', 'lawn-mowing', 'Cut and maintain lawn grass', gardening_id, true, 1, 90, 500.00, 'fixed', true, false),
    (uuid_generate_v4(), 'Garden Maintenance', 'garden-maintenance', 'Regular garden upkeep', gardening_id, true, 2, 120, 800.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Tree Trimming', 'tree-trimming', 'Prune and trim trees', gardening_id, true, 3, 180, 1200.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Planting Service', 'planting-service', 'Plant trees, shrubs, and flowers', gardening_id, true, 4, 120, 600.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Landscape Design', 'landscape-design', 'Design and plan garden layout', gardening_id, true, 5, 240, 2000.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Pest Control - Garden', 'pest-control-garden', 'Control garden pests naturally', gardening_id, true, 6, 90, 700.00, 'fixed', true, true);

    -- Computer & Tech Skills
    INSERT INTO skills (id, name, slug, description, category_id, is_active, display_order, estimated_duration_minutes, base_price, price_unit, requires_tools, requires_materials) VALUES
    (uuid_generate_v4(), 'Computer Repair', 'computer-repair', 'Fix hardware and software issues', tech_id, true, 1, 120, 800.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'Laptop Service', 'laptop-service', 'Laptop repair and upgrade', tech_id, true, 2, 120, 900.00, 'per_hour', true, true),
    (uuid_generate_v4(), 'WiFi Setup', 'wifi-setup', 'Install and configure WiFi networks', tech_id, true, 3, 60, 600.00, 'fixed', true, true),
    (uuid_generate_v4(), 'CCTV Installation', 'cctv-installation', 'Install security camera systems', tech_id, true, 4, 180, 1500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Printer Setup', 'printer-setup', 'Install and configure printers', tech_id, true, 5, 60, 500.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Data Recovery', 'data-recovery', 'Recover lost data from devices', tech_id, true, 6, 180, 2000.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Virus Removal', 'virus-removal', 'Remove malware and viruses', tech_id, true, 7, 90, 700.00, 'fixed', true, true),
    (uuid_generate_v4(), 'Software Installation', 'software-installation', 'Install and configure software', tech_id, true, 8, 60, 500.00, 'fixed', true, false);

END $$;

-- ============================================
-- CREATE ADMIN USER
-- ============================================

INSERT INTO users (id, email, name, role, password_hash, kyc_status, is_active, is_email_verified, is_phone_verified)
VALUES (
    uuid_generate_v4(),
    'admin@helpinminutes.com',
    'System Administrator',
    'ADMIN',
    '$2a$12$9WVvJCmZscJQxVflP.sEeuOHavkbW/x7SUeI4vQkmOvcOPCE7f5LK',
    'VERIFIED',
    true,
    true,
    true
);
