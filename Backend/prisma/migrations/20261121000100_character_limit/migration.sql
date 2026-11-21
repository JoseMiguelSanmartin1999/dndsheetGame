-- Límite de personajes activos por usuario (por defecto 5, users.max_characters).
-- El servicio también lo valida para dar un mensaje claro; este trigger es la
-- garantía final, incluso con dos peticiones simultáneas (bloquea la fila del usuario).

CREATE OR REPLACE FUNCTION enforce_character_limit() RETURNS trigger AS $$
DECLARE
  user_limit INTEGER;
  active_count INTEGER;
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND OLD.user_id = NEW.user_id THEN
    RETURN NEW; -- edición normal de un personaje ya activo
  END IF;

  SELECT max_characters INTO user_limit FROM users WHERE id = NEW.user_id FOR UPDATE;

  SELECT count(*) INTO active_count
  FROM characters
  WHERE user_id = NEW.user_id AND deleted_at IS NULL AND id <> NEW.id;

  IF active_count >= user_limit THEN
    RAISE EXCEPTION 'CHARACTER_LIMIT_REACHED: el usuario ya tiene % personajes (máximo %)', active_count, user_limit
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER characters_limit
  BEFORE INSERT OR UPDATE OF deleted_at, user_id ON characters
  FOR EACH ROW EXECUTE FUNCTION enforce_character_limit();
