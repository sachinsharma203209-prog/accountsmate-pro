
CREATE OR REPLACE FUNCTION public.validate_ledger_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.debit > 0 AND NEW.credit > 0 THEN
    RAISE EXCEPTION 'Both debit and credit cannot be filled';
  END IF;
  IF NEW.debit = 0 AND NEW.credit = 0 THEN
    RAISE EXCEPTION 'Either debit or credit must be entered';
  END IF;
  IF NEW.debit < 0 OR NEW.credit < 0 THEN
    RAISE EXCEPTION 'Negative values not allowed';
  END IF;
  RETURN NEW;
END;
$$;
