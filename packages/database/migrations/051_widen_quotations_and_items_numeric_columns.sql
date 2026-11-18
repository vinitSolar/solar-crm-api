-- Migration 051: Widen numeric column precision for quotations, quotation items, packages, leads, and products
-- Prevents "numeric field overflow" (SQLSTATE 22003) when handling large amounts or quantities

ALTER TABLE quotations 
    ALTER COLUMN system_size TYPE NUMERIC(15, 2),
    ALTER COLUMN subtotal TYPE NUMERIC(20, 2),
    ALTER COLUMN gst_amount TYPE NUMERIC(20, 2),
    ALTER COLUMN grand_total TYPE NUMERIC(20, 2),
    ALTER COLUMN discount TYPE NUMERIC(20, 2),
    ALTER COLUMN net_customer_cost TYPE NUMERIC(20, 2);

ALTER TABLE quotation_items 
    ALTER COLUMN quantity TYPE NUMERIC(15, 2),
    ALTER COLUMN price_per_unit TYPE NUMERIC(20, 2),
    ALTER COLUMN gst_percentage TYPE NUMERIC(8, 2),
    ALTER COLUMN line_total TYPE NUMERIC(20, 2);

ALTER TABLE package_products
    ALTER COLUMN quantity TYPE DECIMAL(15, 2),
    ALTER COLUMN unit_price_snapshot TYPE DECIMAL(20, 2);

ALTER TABLE leads
    ALTER COLUMN system_size TYPE NUMERIC(15, 2),
    ALTER COLUMN monthly_bill_amount TYPE NUMERIC(20, 2);

ALTER TABLE products
    ALTER COLUMN price_per_unit TYPE NUMERIC(20, 2),
    ALTER COLUMN gst_percentage TYPE NUMERIC(8, 2);

ALTER TABLE payments
    ALTER COLUMN amount TYPE NUMERIC(20, 2);
