# SwingPilot Offline Visual Library

A local, offline-friendly image library for organizing and viewing trading screenshots, strategy charts, and visual references.

## 1. Project Overview

SwingPilot Offline Visual Library is a Python Flask application designed to help you manage and review your local collection of trading-related images.

The application code is stored in GitHub. Your private image collection and local database remain on your computer.

## 2. Project Structure

```text
SwingPilot_Offline_Library/
├── app.py
├── requirements.txt
├── README.txt
├── Start_SwingPilot.bat
├── .gitignore
├── catalog.db                 # Local database; not uploaded
├── library/                   # Your local images; not uploaded
├── backups/                   # Local backups; not uploaded
├── docs/
│   └── SwingPilot_Offline_Visual_Library_Usage_Maintenance.md
├── static/
│   ├── app.js
│   └── style.css
├── templates/
│   └── index.html
└── .venv/                     # Python virtual environment; not uploaded
```

Some local files or folders may not exist until the application creates them.

## 3. Requirements

- Python 3
- Visual Studio Code with WSL Ubuntu, or a compatible Linux terminal
- A web browser
- Internet access when installing Python dependencies for the first time

The application is intended to run locally on your computer.

## 4. Start the Application

Open the project folder in VS Code using WSL Ubuntu.

In the terminal, run:

```bash
cd ~/projects/SwingPilot_Offline_Library
source .venv/bin/activate
python app.py
```

Keep the terminal open while the application is running.

Open the local application in your browser:

http://127.0.0.1:8765

If the terminal reports a different port, use the port shown in the terminal.

To stop the application, return to the terminal and press `Ctrl+C`.

## 5. Install or Restore Dependencies

If the virtual environment is missing or needs to be recreated, run:

```bash
cd ~/projects/SwingPilot_Offline_Library
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Then start the application:

```bash
python app.py
```

Do not delete your local database or image library when recreating the virtual environment.

## 6. Manage Images

- Import images using the application's available image-import functionality.
- Keep your original screenshots in a safe location if they are important.
- The `library/` folder contains local image files.
- Do not add private images to GitHub unless you intentionally decide to publish them.
- Avoid renaming or moving library files manually unless you understand how the application references them.

## 7. Local Data and Privacy

The `.gitignore` file excludes local application data, including:

- `catalog.db`
- `library/`
- `backups/`
- `.venv/`
- Python cache files and operating-system metadata files

These rules help prevent accidental uploads. They do not encrypt files or protect against someone who has access to your computer.

Before every GitHub update, check:

```bash
git status
git ls-files catalog.db library backups .venv
```

The second command should print nothing if those paths are not tracked.

Important: `.gitignore` does not automatically remove files that were committed in the past. Check the repository if you suspect private data was previously uploaded.

## 8. Back Up Local Data

Before making major application changes:

1. Stop the application.
2. Copy `catalog.db`, if present, to a secure backup location.
3. Back up the complete `library/` folder.
4. Back up any important files in `backups/`.
5. Verify that your copied images and database files exist before deleting or replacing anything.

Store backups outside the project folder when possible. Keep sensitive data private.

## 9. Safe GitHub Update Workflow

Check the current state:

```bash
git status
```

Review the changes before staging:

```bash
git diff
```

Stage only the files you intend to publish. For example:

```bash
git add .gitignore README.txt app.py requirements.txt static/ templates/ docs/
```

Review the staged files:

```bash
git diff --cached --name-only
```

Make sure no private images, database files, backups, or virtual-environment files are listed.

Commit and push:

```bash
git commit -m "Describe the update"
git push
```

If there are no changes to commit, Git will tell you that there is nothing to commit.

## 10. Troubleshooting

### Application does not start

- Confirm that the terminal is in the project folder.
- Activate `.venv`.
- Check that dependencies are installed.
- Read the complete error message in the terminal.

### Browser cannot connect

- Confirm that `python app.py` is still running.
- Check the port printed in the terminal.
- Try `http://127.0.0.1:8765` if the application uses port 8765.

### Images are missing

- Confirm that the files still exist in `library/`.
- Check whether the application expects images to be imported through its interface.
- Do not delete or rebuild the database before backing up local data.

### Git shows unexpected files

Run:

```bash
git status --short --ignored
git check-ignore -v catalog.db library/PUT_IMPORTED_IMAGES_HERE.txt
```

Remember that ignored files remain on your computer; they are simply excluded from normal Git tracking.

## 11. Maintenance Guide

For detailed usage and maintenance instructions, see:

`docs/SwingPilot_Offline_Visual_Library_Usage_Maintenance.md`

## 12. GitHub Repository

Source code and documentation:

https://github.com/zahiruddinsayed99-sys/SwingPilot-Offline-Visual-Library

The repository stores the application source and documentation. Your local image library and database should remain private.

---

**Project:** SwingPilot Offline Visual Library  
**Purpose:** Local trading-image organization and review  
**Data policy:** Application source in GitHub; private image collection and local database on your computer.
