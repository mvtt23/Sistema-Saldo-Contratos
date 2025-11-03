/*
  # Seed Initial Data

  1. Data Insertion
    - Insert sample companies
    - Insert managing units
    - Insert programs
    - Insert contracts with related data
    
  2. Notes
    - This migration populates the database with sample data for testing
    - Uses gen_random_uuid() for UUID generation
    - Uses ON CONFLICT to prevent duplicate entries
*/

-- Insert companies
DO $$
DECLARE
  comp1_id uuid := gen_random_uuid();
  comp2_id uuid := gen_random_uuid();
  comp3_id uuid := gen_random_uuid();
  comp4_id uuid := gen_random_uuid();
  comp5_id uuid := gen_random_uuid();
  unit1_id uuid := gen_random_uuid();
  unit2_id uuid := gen_random_uuid();
  unit3_id uuid := gen_random_uuid();
  unit4_id uuid := gen_random_uuid();
  cont1_id uuid := gen_random_uuid();
  cont2_id uuid := gen_random_uuid();
  cont3_id uuid := gen_random_uuid();
  cont4_id uuid := gen_random_uuid();
  cont5_id uuid := gen_random_uuid();
BEGIN
  -- Insert companies
  INSERT INTO companies (id, name, document, city, state) VALUES
    (comp1_id, 'Papelaria Educacional Ltda', '12.345.678/0001-90', 'São Paulo', 'SP'),
    (comp2_id, 'Limpeza Total Serviços Ltda', '98.765.432/0001-10', 'São Paulo', 'SP'),
    (comp3_id, 'Construtora Cidade Nova Ltda', '11.222.333/0001-44', 'São Paulo', 'SP'),
    (comp4_id, 'Auto Mecânica Central Ltda', '55.666.777/0001-88', 'São Paulo', 'SP'),
    (comp5_id, 'Distribuidora Farmacêutica São Paulo Ltda', '99.888.777/0001-66', 'São Paulo', 'SP')
  ON CONFLICT (document) DO NOTHING;

  -- Get existing company IDs if they already exist
  SELECT id INTO comp1_id FROM companies WHERE document = '12.345.678/0001-90';
  SELECT id INTO comp2_id FROM companies WHERE document = '98.765.432/0001-10';
  SELECT id INTO comp3_id FROM companies WHERE document = '11.222.333/0001-44';
  SELECT id INTO comp4_id FROM companies WHERE document = '55.666.777/0001-88';
  SELECT id INTO comp5_id FROM companies WHERE document = '99.888.777/0001-66';

  -- Insert managing units
  INSERT INTO managing_units (id, name, code, responsible, email, phone) VALUES
    (unit1_id, 'Secretaria de Educação', 'SEMED', 'Maria Silva', 'maria.silva@prefeitura.gov.br', '(11) 3333-1111'),
    (unit2_id, 'Secretaria de Saúde', 'SESAU', 'João Santos', 'joao.santos@prefeitura.gov.br', '(11) 3333-2222'),
    (unit3_id, 'Secretaria de Obras', 'SEOBR', 'Ana Costa', 'ana.costa@prefeitura.gov.br', '(11) 3333-3333'),
    (unit4_id, 'Secretaria de Transporte', 'SETRANS', 'Carlos Lima', 'carlos.lima@prefeitura.gov.br', '(11) 3333-4444')
  ON CONFLICT (code) DO NOTHING;

  -- Get existing unit IDs if they already exist
  SELECT id INTO unit1_id FROM managing_units WHERE code = 'SEMED';
  SELECT id INTO unit2_id FROM managing_units WHERE code = 'SESAU';
  SELECT id INTO unit3_id FROM managing_units WHERE code = 'SEOBR';
  SELECT id INTO unit4_id FROM managing_units WHERE code = 'SETRANS';

  -- Insert programs
  INSERT INTO programs (name, unit_id) VALUES
    ('Programa de Educação Básica', unit1_id),
    ('Programa de Educação Infantil', unit1_id),
    ('Programa de Atenção Básica', unit2_id),
    ('Programa de Saúde da Família', unit2_id),
    ('Programa de Infraestrutura', unit3_id),
    ('Programa de Mobilidade Urbana', unit4_id)
  ON CONFLICT DO NOTHING;

  -- Insert contracts
  INSERT INTO contracts (id, number, modality, is_carona, object, contractor_id, managing_unit_id, original_value, current_value, used_value, remaining_balance, start_date, end_date, status) VALUES
    (cont1_id, '001/2024', 'pregao-eletronico', false, 'Fornecimento de material escolar para rede municipal de ensino', comp1_id, unit1_id, 150000.00, 180000.00, 95000.00, 85000.00, '2024-01-15', '2024-12-31', 'active'),
    (cont2_id, '002/2024', 'concorrencia-publica', false, 'Serviços de limpeza e conservação de unidades de saúde', comp2_id, unit2_id, 240000.00, 240000.00, 160000.00, 80000.00, '2024-02-01', '2025-01-31', 'active'),
    (cont3_id, '003/2024', 'concorrencia-publica', false, 'Reforma e ampliação da Escola Municipal João da Silva', comp3_id, unit3_id, 500000.00, 650000.00, 325000.00, 325000.00, '2024-03-01', '2024-11-30', 'active'),
    (cont4_id, '004/2024', 'registro-preco', false, 'Manutenção preventiva e corretiva da frota municipal', comp4_id, unit4_id, 120000.00, 120000.00, 45000.00, 75000.00, '2024-01-01', '2024-12-31', 'active'),
    (cont5_id, '005/2024', 'dispensa', false, 'Fornecimento de medicamentos para farmácia básica', comp5_id, unit2_id, 300000.00, 300000.00, 300000.00, 0.00, '2024-01-01', '2024-06-30', 'completed')
  ON CONFLICT (number) DO NOTHING;

  -- Get existing contract IDs if they already exist
  SELECT id INTO cont1_id FROM contracts WHERE number = '001/2024';
  SELECT id INTO cont2_id FROM contracts WHERE number = '002/2024';
  SELECT id INTO cont3_id FROM contracts WHERE number = '003/2024';
  SELECT id INTO cont4_id FROM contracts WHERE number = '004/2024';
  SELECT id INTO cont5_id FROM contracts WHERE number = '005/2024';

  -- Insert additives
  INSERT INTO additives (contract_id, type, description, value_change, term_change, date, justification) VALUES
    (cont1_id, 'value', 'Aditivo para aumento de valor devido à demanda adicional', 30000.00, 0, '2024-06-15', 'Aumento do número de alunos matriculados'),
    (cont3_id, 'both', 'Aditivo para ampliação do projeto e extensão de prazo', 150000.00, 60, '2024-07-15', 'Necessidade de ampliação da área construída conforme demanda da comunidade')
  ON CONFLICT DO NOTHING;

  -- Insert invoices
  INSERT INTO invoices (contract_id, number, value, date) VALUES
    (cont1_id, 'NF-001', 25000.00, '2024-02-01'),
    (cont1_id, 'NF-002', 35000.00, '2024-03-01'),
    (cont1_id, 'NF-003', 35000.00, '2024-04-01'),
    (cont2_id, 'NF-101', 40000.00, '2024-02-28'),
    (cont2_id, 'NF-102', 40000.00, '2024-03-31'),
    (cont2_id, 'NF-103', 40000.00, '2024-04-30'),
    (cont2_id, 'NF-104', 40000.00, '2024-05-31'),
    (cont3_id, 'NF-201', 125000.00, '2024-04-15'),
    (cont3_id, 'NF-202', 200000.00, '2024-06-15'),
    (cont4_id, 'NF-301', 15000.00, '2024-02-05'),
    (cont4_id, 'NF-302', 18000.00, '2024-03-05'),
    (cont4_id, 'NF-303', 12000.00, '2024-04-05'),
    (cont5_id, 'NF-401', 100000.00, '2024-02-15'),
    (cont5_id, 'NF-402', 100000.00, '2024-04-15'),
    (cont5_id, 'NF-403', 100000.00, '2024-06-15')
  ON CONFLICT DO NOTHING;
END $$;