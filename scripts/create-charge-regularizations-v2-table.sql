-- Créer la table charge_regularizations_v2 si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.charge_regularizations_v2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    days_occupied INTEGER NOT NULL DEFAULT 0,
    total_provisions DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_quote_part DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    calculation_method TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lease_id, year)
);

-- Créer la table charge_expenses si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.charge_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    regularization_id UUID NOT NULL REFERENCES public.charge_regularizations_v2(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_recoverable BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table charge_supporting_documents si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.charge_supporting_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES public.charge_expenses(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_v2_lease_id ON public.charge_regularizations_v2(lease_id);
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_v2_year ON public.charge_regularizations_v2(year);
CREATE INDEX IF NOT EXISTS idx_charge_expenses_regularization_id ON public.charge_expenses(regularization_id);
CREATE INDEX IF NOT EXISTS idx_charge_supporting_documents_expense_id ON public.charge_supporting_documents(expense_id);

-- Activer RLS
ALTER TABLE public.charge_regularizations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_supporting_documents ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view their own charge regularizations" ON public.charge_regularizations_v2
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own charge regularizations" ON public.charge_regularizations_v2
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own charge regularizations" ON public.charge_regularizations_v2
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own charge regularizations" ON public.charge_regularizations_v2
    FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Users can view charge expenses for their regularizations" ON public.charge_expenses
    FOR SELECT USING (
        regularization_id IN (
            SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert charge expenses for their regularizations" ON public.charge_expenses
    FOR INSERT WITH CHECK (
        regularization_id IN (
            SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update charge expenses for their regularizations" ON public.charge_expenses
    FOR UPDATE USING (
        regularization_id IN (
            SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete charge expenses for their regularizations" ON public.charge_expenses
    FOR DELETE USING (
        regularization_id IN (
            SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view supporting documents for their charge expenses" ON public.charge_supporting_documents
    FOR SELECT USING (
        expense_id IN (
            SELECT id FROM public.charge_expenses 
            WHERE regularization_id IN (
                SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert supporting documents for their charge expenses" ON public.charge_supporting_documents
    FOR INSERT WITH CHECK (
        expense_id IN (
            SELECT id FROM public.charge_expenses 
            WHERE regularization_id IN (
                SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update supporting documents for their charge expenses" ON public.charge_supporting_documents
    FOR UPDATE USING (
        expense_id IN (
            SELECT id FROM public.charge_expenses 
            WHERE regularization_id IN (
                SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete supporting documents for their charge expenses" ON public.charge_supporting_documents
    FOR DELETE USING (
        expense_id IN (
            SELECT id FROM public.charge_expenses 
            WHERE regularization_id IN (
                SELECT id FROM public.charge_regularizations_v2 WHERE created_by = auth.uid()
            )
        )
    );
