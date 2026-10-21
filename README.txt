SWINGPILOT OFFLINE VISUAL LIBRARY
================================

FIRST-TIME SETUP
1. Extract this entire folder to a location you control, e.g. Documents.
2. Internet may be required once to install Flask if it is not already installed.
3. Double-click Start_SwingPilot.bat.
4. Your browser opens http://127.0.0.1:8765.
5. Keep the black command window open while using the library. Close it to stop the app.

IMPORT YOUR EXISTING IMAGES
1. Click Add images.
2. Select multiple image files from your existing folder.
3. Optionally choose a category and click Import selected.
4. Original source files are not changed. Copies are stored in the library folder.
Supported: PNG, JPG, JPEG, WEBP, GIF, BMP.

FEATURES
- Search titles, descriptions, tags, filenames, and categories
- Favorites, category filters, dark/light theme
- Image viewer with previous/next and click-to-zoom
- Edit title, notes, tags and category
- Add, rename and delete empty categories
- Duplicate detection by SHA-256 hash
- Backup library data and images to a ZIP file

DATA AND BACKUP
- catalog.db stores categories, metadata, and favorites.
- library/ stores imported image copies.
- backups/ stores ZIP backups.
- To make a complete manual backup, close the app and copy the entire folder.
- The built-in backup creates a ZIP of catalog.db and imported images.
- Keep the original image folder and your backups until you have verified the imported library.

OFFLINE NOTE
The app itself does not require an internet connection after setup. It listens only on
127.0.0.1 (your own computer). Flask may need to be installed once at first launch.
