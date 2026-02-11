
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (for secure role checking)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT,
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Ledger entries table
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  short_description TEXT NOT NULL,
  long_description TEXT,
  debit NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Activity logs for delete actions
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Validation trigger: debit and credit cannot both be non-zero
CREATE OR REPLACE FUNCTION public.validate_ledger_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER validate_ledger_entry_trigger
BEFORE INSERT OR UPDATE ON public.ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.validate_ledger_entry();

-- Auto-create profile and role on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'staff')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'staff')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Profiles: all authenticated can view, only own profile can update
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

-- User roles: only readable by authenticated
CREATE POLICY "Authenticated can view roles"
ON public.user_roles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Customers: all authenticated can view, admin can do everything, staff can insert
CREATE POLICY "Authenticated can view customers"
ON public.customers FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin can insert customers"
ON public.customers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update customers"
ON public.customers FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete customers"
ON public.customers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Ledger entries: all authenticated can view, all can insert, only admin can update/delete
CREATE POLICY "Authenticated can view ledger entries"
ON public.ledger_entries FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert ledger entries"
ON public.ledger_entries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admin can update ledger entries"
ON public.ledger_entries FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete ledger entries"
ON public.ledger_entries FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Activity logs: only admin can view, all authenticated can insert
CREATE POLICY "Admin can view activity logs"
ON public.activity_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert activity logs"
ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = performed_by);
