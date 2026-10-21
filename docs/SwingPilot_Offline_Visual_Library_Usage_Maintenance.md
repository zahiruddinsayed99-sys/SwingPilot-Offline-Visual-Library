# SwingPilot Offline Visual Library
## Regular Usage & Maintenance Guide

**Environment:** Windows browser + WSL Ubuntu + Python 3  
**Dashboard:** `http://127.0.0.1:8765`  
**Application folder:** `~/projects/SwingPilot_Offline_Library` (adjust if yours differs)

## 1. Start the application

1. Open VS Code in the **WSL: Ubuntu** environment and open the application folder.
2. Open **Terminal → New Terminal**.
3. Run:

   ```bash
   cd ~/projects/SwingPilot_Offline_Library
   source .venv/bin/activate
   python app.py
   ```

4. Wait for the message showing `http://127.0.0.1:8765`, then open that address in your Windows browser.
5. Keep the terminal running while using the dashboard.

To stop the app, focus the terminal and press `Ctrl+C`.

If the virtual environment does not exist:

```bash
cd ~/projects/SwingPilot_Offline_Library
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

If Ubuntu says the `venv` package is missing:

```bash
sudo apt update
sudo apt install python3-venv
```

## 2. Add images

1. Click **Add images**.
2. Select one or more image files.
3. Optionally assign a category.
4. Click **Import selected** and wait for confirmation.

Supported formats: PNG, JPG/JPEG, WEBP, GIF, BMP.

### How image storage works

- Imported images are **copied** into the application's `library/` folder. Your original source files are not changed.
- Exact duplicate files are detected by SHA-256 hash and skipped.
- The app does **not** automatically scan or synchronize your source folder. Import new images using **Add images**.
- Do not manually rename or remove files inside `library/`; the database stores their filenames.

## 3. Browse and manage visuals

- **All visuals:** show all imported images.
- **Categories:** filter by a category in the sidebar.
- **Favorites:** show images marked as favorites.
- **Search:** search titles, descriptions, tags, original filenames, and category names.
- **Sort:** recently added, title A–Z, or oldest first.
- **Viewer:** click a card to open it; use previous/next arrows to navigate.
- **Zoom:** click the large image to zoom in or return to normal.
- **Edit details:** update title, category, description, and comma-separated tags, then click **Save changes**.
- **Favorites:** use the star on a card or in the viewer.
- **Theme:** use the sun/moon control to switch between light and dark themes.
- **Shortcuts:** `Ctrl+K` focuses search; `Esc` closes the viewer/dialog; left/right arrows navigate while the viewer is open.

### Organization tips

Use clear titles, one broad category per image, and a few useful tags such as `VWAP, breakout, stop-loss`. Keep categories broad and use tags for narrower concepts. Use Favorites for visuals you revisit frequently.

## 4. Category maintenance

Use **Manage categories** to add, rename, or delete categories.

- Before deleting a category, move its images to another category. Only empty categories can be deleted.
- Avoid creating many nearly identical categories.
- The default categories are already available; add new ones only when a topic becomes recurring.

## 5. Backup routine

### Recommended schedule

- Create a backup before a large import, category cleanup, or code upgrade.
- Create one after a major organization session.
- Periodically copy a backup to a separate location, such as a Windows drive or external disk.
- Do not keep the only backup inside the same WSL project folder.

### Create a backup

1. Click **Backup library**.
2. Note the ZIP filename/path shown by the app.
3. In VS Code Explorer, open the `backups/` folder and confirm the ZIP exists.
4. Copy the ZIP to a separate safe location.

The built-in ZIP includes `catalog.db` and the imported images. It is a backup, not an automatic restore tool.

### Extra full-folder backup

For extra protection, stop the app with `Ctrl+C` and copy the entire application folder, including `catalog.db`, `library/`, `app.py`, `static/`, `templates/`, and `requirements.txt`.

### Restore caution

Before restoring anything, stop the server and copy the current application folder somewhere safe. The current version creates backup ZIPs, but restoration is manual; do not extract over a running app or overwrite files without a verified restore procedure.

## 6. Safe upgrades and maintenance

### Before changing code

1. Stop the app with `Ctrl+C`.
2. Create a dashboard backup if the app is working.
3. Copy the full application folder to a dated backup location.
4. Make one change at a time.

### After changing code

```bash
cd ~/projects/SwingPilot_Offline_Library
source .venv/bin/activate
python -m py_compile app.py
python app.py
```

Then verify the dashboard opens and test the changed feature. Check that existing images, categories, favorites, notes, and tags are still available. Keep your backup until the update is stable.

### Dependencies

- Flask is listed in `requirements.txt`.
- Do not delete `.venv/` unless you are prepared to recreate it.
- Do not upgrade Python or Flask just for routine use if everything works.
- To reinstall dependencies:

  ```bash
  source .venv/bin/activate
  python -m pip install -r requirements.txt
  ```

## 7. Troubleshooting

### Browser cannot reach the dashboard

1. Check that the terminal is still running `python app.py`.
2. Confirm it shows `http://127.0.0.1:8765`.
3. Open that exact address.
4. Read the latest terminal lines if an error appears.

### `ModuleNotFoundError: No module named 'flask'`

```bash
cd ~/projects/SwingPilot_Offline_Library
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

### `.venv/bin/activate` does not exist

```bash
cd ~/projects/SwingPilot_Offline_Library
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### Images are missing or broken

- Check that the image files still exist in `library/`.
- Do not manually rename or remove imported image files.
- Check that `catalog.db` and `library/` came from the same backup.
- If a file was manually removed, stop the app and restore the matching database and image backup together.

### Code changes do not appear

- Refresh the browser with `Ctrl+F5`.
- Check the terminal for Python errors.
- Restart the app after Python changes; hard-refresh after CSS or JavaScript changes.

### Category deletion is blocked

Move or recategorize its images first. The category must be empty before deletion.

## 8. Privacy and offline behavior

- The server listens on `127.0.0.1`, intended for use on your own computer.
- Normal library use does not need internet after Flask is installed.
- Initial dependency installation may require internet access.
- Keep the application folder and backup ZIPs in a location you control.
- This is a local personal-use tool, not a hardened public-facing production service. Do not expose its port to the internet.

## 9. Quick daily checklist

- [ ] Start the app and open `http://127.0.0.1:8765`.
- [ ] Import new images through **Add images**.
- [ ] Add useful titles, categories, notes, and tags.
- [ ] Favorite frequently used visuals.
- [ ] Create a backup after significant changes.
- [ ] Copy important backups outside the WSL project periodically.
- [ ] Stop the app with `Ctrl+C` when finished.

## 10. Future upgrade ideas

When useful, potential improvements include:

1. Scan/import images from a selected source folder.
2. Safe rescan/synchronization that preserves notes and categories.
3. A proper restore-from-backup workflow.
4. Multi-select category/tag editing.
5. Better performance for very large libraries.
6. Export metadata to CSV/JSON.
7. Duplicate review and orphaned-file detection.
8. Application versioning and upgrade/migration notes.

**Upgrade principle:** keep a dated backup, change one thing at a time, test with a few images, then resume regular use.

---

*End of guide.*
