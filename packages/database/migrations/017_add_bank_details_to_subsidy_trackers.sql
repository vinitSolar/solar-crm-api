-- Add Customer Bank Details to Subsidy Trackers
ALTER TABLE subsidy_trackers
ADD COLUMN account_name VARCHAR(255),
ADD COLUMN account_number VARCHAR(100),
ADD COLUMN ifsc_code VARCHAR(50),
ADD COLUMN bank_name VARCHAR(255),
ADD COLUMN branch_name VARCHAR(255);

COMMENT ON COLUMN subsidy_trackers.account_name IS 'Customer bank account name for subsidy';
COMMENT ON COLUMN subsidy_trackers.account_number IS 'Customer bank account number for subsidy';
COMMENT ON COLUMN subsidy_trackers.ifsc_code IS 'Bank IFSC code';
COMMENT ON COLUMN subsidy_trackers.bank_name IS 'Name of the bank';
COMMENT ON COLUMN subsidy_trackers.branch_name IS 'Bank branch name';
