-- Script de test pour la fonctionnalité de favoris
-- Ce script permet de tester la table des favoris et les contraintes

-- 1. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'favorites' 
ORDER BY ordinal_position;

-- 2. Tester l'insertion d'un favori
INSERT INTO favorites (user_id, property_id) 
VALUES (
    '00000000-0000-0000-0000-000000000001', -- UUID de test utilisateur
    '00000000-0000-0000-0000-000000000002'  -- UUID de test propriété
);

-- 3. Vérifier l'insertion
SELECT * FROM favorites 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 4. Tester la contrainte d'unicité (doit échouer)
INSERT INTO favorites (user_id, property_id) 
VALUES (
    '00000000-0000-0000-0000-000000000001', -- Même utilisateur
    '00000000-0000-0000-0000-000000000002'  -- Même propriété
);

-- 5. Tester la suppression
DELETE FROM favorites 
WHERE user_id = '00000000-0000-0000-0000-000000000001' 
AND property_id = '00000000-0000-0000-0000-000000000002';

-- 6. Vérifier la suppression
SELECT COUNT(*) as count FROM favorites 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 7. Tester la jointure avec les propriétés
SELECT 
    f.id,
    f.user_id,
    f.property_id,
    f.created_at,
    p.title,
    p.price,
    p.city
FROM favorites f
LEFT JOIN properties p ON f.property_id = p.id
LIMIT 10;

-- 8. Compter les favoris par utilisateur
SELECT 
    user_id,
    COUNT(*) as favorite_count
FROM favorites 
GROUP BY user_id
ORDER BY favorite_count DESC;

-- 9. Compter les favoris par propriété
SELECT 
    property_id,
    COUNT(*) as favorite_count
FROM favorites 
GROUP BY property_id
ORDER BY favorite_count DESC;
