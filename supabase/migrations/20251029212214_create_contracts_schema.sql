/*
  # Create Complete Contract Management Schema

  1. New Tables
    - `managing_units` - Stores government departments/units
      - `id` (uuid, primary key)
      - `name` (text) - Unit name
      - `code` (text) - Unit code
      - `responsible` (text) - Responsible person
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `programs` - Programs within managing units
      - `id` (uuid, primary key)
      - `name` (text) - Program name
      - `unit_id` (uuid) - Foreign key to managing_units
      - `created_at` (timestamptz)
    
    - `companies` - Contractors/suppliers
      - `id` (uuid, primary key)
      - `name` (text) - Company name
      - `document` (text) - CNPJ
      - `city` (text) - City
      - `state` (text) - State
      - `created_at` (timestamptz)
    
    - `contracts` - Main contracts table
      - `id` (uuid, primary key)
      - `number` (text) - Contract number
      - `modality` (text) - Contract type
      - `is_carona` (boolean) - If it's a "carona" contract
      - `object` (text) - Contract object/description
      - `contractor_id` (uuid) - Foreign key to companies
      - `managing_unit_id` (uuid) - Foreign key to managing_units
      - `original_value` (numeric) - Original contract value
      - `current_value` (numeric) - Current contract value
      - `used_value` (numeric) - Used amount
      - `remaining_balance` (numeric) - Remaining balance
      - `start_date` (date) - Contract start date
      - `end_date` (date) - Contract end date
      - `status` (text) - Contract status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `additives` - Contract additives/amendments
      - `id` (uuid, primary key)
      - `contract_id` (uuid) - Foreign key to contracts
      - `type` (text) - Type: value, term, or both
      - `description` (text) - Additive description
      - `value_change` (numeric) - Value change amount
      - `term_change` (integer) - Term change in days
      - `date` (date) - Additive date
      - `justification` (text) - Justification
      - `created_at` (timestamptz)
    
    - `invoices` - Contract invoices
      - `id` (uuid, primary key)
      - `contract_id` (uuid) - Foreign key to contracts
      - `number` (text) - Invoice number
      - `value` (numeric) - Invoice value
      - `date` (date) - Invoice date
      - `created_at` (timestamptz)
    
    - `payments` - Contract payments
      - `id` (uuid, primary key)
      - `contract_id` (uuid) - Foreign key to contracts
      - `description` (text) - Payment description
      - `value` (numeric) - Payment value
      - `date` (date) - Payment date
      - `invoice` (text) - Invoice reference
      - `status` (text) - Payment status
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage all data
    
  3. Indexes
    - Add indexes for foreign keys and commonly queried fields
*/

-- Create managing_units table
CREATE TABLE IF NOT EXISTS managing_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  responsible text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit_id uuid NOT NULL REFERENCES managing_units(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text NOT NULL UNIQUE,
  city text NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  modality text NOT NULL CHECK (modality IN ('dispensa', 'pregao-eletronico', 'concorrencia-publica', 'chamada-publica', 'registro-preco')),
  is_carona boolean DEFAULT false,
  object text NOT NULL,
  contractor_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  managing_unit_id uuid NOT NULL REFERENCES managing_units(id) ON DELETE RESTRICT,
  original_value numeric(15,2) NOT NULL DEFAULT 0,
  current_value numeric(15,2) NOT NULL DEFAULT 0,
  used_value numeric(15,2) NOT NULL DEFAULT 0,
  remaining_balance numeric(15,2) NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create additives table
CREATE TABLE IF NOT EXISTS additives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('value', 'term', 'both')),
  description text NOT NULL,
  value_change numeric(15,2) DEFAULT 0,
  term_change integer DEFAULT 0,
  date date NOT NULL,
  justification text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  number text NOT NULL,
  value numeric(15,2) NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  description text NOT NULL,
  value numeric(15,2) NOT NULL,
  date date NOT NULL,
  invoice text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_programs_unit_id ON programs(unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contractor_id ON contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_managing_unit_id ON contracts(managing_unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_additives_contract_id ON additives(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);

-- Enable RLS
ALTER TABLE managing_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE additives ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for managing_units
CREATE POLICY "Allow authenticated users to view managing units"
  ON managing_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert managing units"
  ON managing_units FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update managing units"
  ON managing_units FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete managing units"
  ON managing_units FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for programs
CREATE POLICY "Allow authenticated users to view programs"
  ON programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete programs"
  ON programs FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for companies
CREATE POLICY "Allow authenticated users to view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for contracts
CREATE POLICY "Allow authenticated users to view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for additives
CREATE POLICY "Allow authenticated users to view additives"
  ON additives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert additives"
  ON additives FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update additives"
  ON additives FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete additives"
  ON additives FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for invoices
CREATE POLICY "Allow authenticated users to view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for payments
CREATE POLICY "Allow authenticated users to view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);