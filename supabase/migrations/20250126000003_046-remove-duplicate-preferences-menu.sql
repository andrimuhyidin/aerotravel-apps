-- Remove duplicate Preferences menu item
-- Settings already includes Preferences functionality

-- Delete the Preferences menu item
DELETE FROM guide_menu_items 
WHERE href = '/guide/preferences' 
  AND section = 'Pengaturan';

-- Update Settings label to be more descriptive
UPDATE guide_menu_items
SET label = 'Pengaturan & Preferensi',
    description = 'Pengaturan aplikasi dan preferensi kerja'
WHERE href = '/guide/settings'
  AND section = 'Pengaturan';

