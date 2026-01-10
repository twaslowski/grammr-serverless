CREATE TABLE profiles
(
    id              UUID PRIMARY KEY REFERENCES auth.users (id),
    source_language VARCHAR(3),
    target_language VARCHAR(3),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user access to their own profile"
    ON public.profiles
    FOR ALL
    USING (auth.uid() = id);
