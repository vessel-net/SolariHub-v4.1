-- =======================================================================
-- SolariHub PostgreSQL Database Initialization
-- Phase 0: Foundation Migration
-- =======================================================================

-- Create schemas for organized data structure
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS marketplace;
CREATE SCHEMA IF NOT EXISTS energy;
CREATE SCHEMA IF NOT EXISTS finance;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =======================================================================
-- AUTH SCHEMA - User Management & Authentication
-- =======================================================================

-- Users table
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('buyer', 'seller', 'logistics', 'finance', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE auth.user_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_progress', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_role ON auth.users(role);
CREATE INDEX idx_users_email_verified ON auth.users(email_verified);
CREATE INDEX idx_user_profiles_kyc_status ON auth.user_profiles(kyc_status);

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================
-- MARKETPLACE SCHEMA - Product Catalog & Orders
-- =======================================================================

-- Product categories table
CREATE TABLE marketplace.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES marketplace.categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE marketplace.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES marketplace.categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    inventory_count INTEGER DEFAULT 0,
    images JSONB,
    specifications JSONB,
    certifications JSONB,
    carbon_footprint DECIMAL(8,2),
    energy_rating VARCHAR(10),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for marketplace
CREATE INDEX idx_categories_slug ON marketplace.categories(slug);
CREATE INDEX idx_categories_parent_id ON marketplace.categories(parent_id);
CREATE INDEX idx_products_seller_id ON marketplace.products(seller_id);
CREATE INDEX idx_products_category_id ON marketplace.products(category_id);
CREATE INDEX idx_products_status ON marketplace.products(status);
CREATE INDEX idx_products_price ON marketplace.products(price);

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON marketplace.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================
-- ENERGY SCHEMA - IoT Devices & Energy Management
-- =======================================================================

-- IoT devices table
CREATE TABLE energy.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type VARCHAR(50) NOT NULL,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    location JSONB,
    specifications JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor data table (for time-series data)
CREATE TABLE energy.sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES energy.devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    energy_produced DECIMAL(10,4),
    energy_consumed DECIMAL(10,4),
    voltage DECIMAL(8,2),
    current DECIMAL(8,2),
    power_factor DECIMAL(4,3),
    temperature DECIMAL(5,2),
    metadata JSONB
);

-- Create indexes for energy schema
CREATE INDEX idx_devices_user_id ON energy.devices(user_id);
CREATE INDEX idx_devices_device_id ON energy.devices(device_id);
CREATE INDEX idx_devices_status ON energy.devices(status);
CREATE INDEX idx_sensor_data_device_id ON energy.sensor_data(device_id);
CREATE INDEX idx_sensor_data_timestamp ON energy.sensor_data(timestamp);

-- =======================================================================
-- FINANCE SCHEMA - Transactions & Payments
-- =======================================================================

-- Transactions table
CREATE TABLE finance.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('payment', 'refund', 'escrow', 'release', 'token_mint', 'token_burn')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    reference_id VARCHAR(255),
    external_transaction_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for finance schema
CREATE INDEX idx_transactions_user_id ON finance.transactions(user_id);
CREATE INDEX idx_transactions_type ON finance.transactions(type);
CREATE INDEX idx_transactions_status ON finance.transactions(status);
CREATE INDEX idx_transactions_reference_id ON finance.transactions(reference_id);
CREATE INDEX idx_transactions_created_at ON finance.transactions(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON finance.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================
-- INSERT DEFAULT DATA
-- =======================================================================

-- Insert default product categories
INSERT INTO marketplace.categories (name, slug, description) VALUES
('Renewable Energy Systems', 'renewable-energy', 'Solar panels, wind turbines, and renewable energy generation systems'),
('Energy Storage', 'energy-storage', 'Battery systems, capacitors, and energy storage solutions'),
('Energy Efficiency', 'energy-efficiency', 'LED lighting, smart monitors, and energy-saving devices'),
('Sustainable Mobility', 'sustainable-mobility', 'Electric vehicles, EV charging stations, and sustainable transport'),
('Sustainable Agriculture', 'sustainable-agriculture', 'Solar irrigation, hydroponic systems, and green farming solutions'),
('Waste Management', 'waste-management', 'Recycling systems, composting, and waste reduction technologies'),
('Water Sustainability', 'water-sustainability', 'Water filtration, rainwater harvesting, and water conservation'),
('Smart Grid Technology', 'smart-grid', 'Grid management, smart meters, and grid optimization systems'),
('Carbon Management', 'carbon-management', 'Carbon capture, offset tracking, and emission reduction systems'),
('Green Building Materials', 'green-building', 'Sustainable construction materials and eco-friendly building supplies');

-- Insert renewable energy subcategories
INSERT INTO marketplace.categories (name, slug, parent_id, description) 
SELECT 'Solar Panels', 'solar-panels', id, 'Photovoltaic solar panels and solar modules'
FROM marketplace.categories WHERE slug = 'renewable-energy';

INSERT INTO marketplace.categories (name, slug, parent_id, description) 
SELECT 'Wind Turbines', 'wind-turbines', id, 'Wind energy generation systems and turbines'
FROM marketplace.categories WHERE slug = 'renewable-energy';

INSERT INTO marketplace.categories (name, slug, parent_id, description) 
SELECT 'Solar Lighting', 'solar-lighting', id, 'Solar-powered lighting systems and fixtures'
FROM marketplace.categories WHERE slug = 'renewable-energy';

-- Insert energy storage subcategories
INSERT INTO marketplace.categories (name, slug, parent_id, description) 
SELECT 'Lithium Batteries', 'lithium-batteries', id, 'Lithium-ion battery systems for energy storage'
FROM marketplace.categories WHERE slug = 'energy-storage';

INSERT INTO marketplace.categories (name, slug, parent_id, description) 
SELECT 'Home Battery Systems', 'home-battery-systems', id, 'Residential battery storage solutions'
FROM marketplace.categories WHERE slug = 'energy-storage';

-- =======================================================================
-- GRANTS AND PERMISSIONS
-- =======================================================================

-- Grant permissions to the application user
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA marketplace TO postgres;
GRANT USAGE ON SCHEMA energy TO postgres;
GRANT USAGE ON SCHEMA finance TO postgres;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA marketplace TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA energy TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finance TO postgres;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA marketplace TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA energy TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA finance TO postgres;

-- =======================================================================
-- COMPLETION MESSAGE
-- =======================================================================

DO $$
BEGIN
    RAISE NOTICE 'SolariHub database initialization completed successfully!';
    RAISE NOTICE 'Schemas created: auth, marketplace, energy, finance';
    RAISE NOTICE 'Tables created: %, %', 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('auth', 'marketplace', 'energy', 'finance')),
        'total tables';
END $$; 