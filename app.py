from flask import Flask, render_template, request, jsonify, send_from_directory
from pathlib import Path
from werkzeug.utils import secure_filename
import sqlite3, hashlib, os, json, shutil, zipfile, io
from datetime import datetime

ROOT = Path(__file__).resolve().parent
LIBRARY = ROOT / "library"
BACKUPS = ROOT / "backups"
DB = ROOT / "catalog.db"
ALLOWED = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}
DEFAULT_CATEGORIES = [
    "Entry Setups & Liquidity Sweeps", "CE/PE Option Buying", "PCR & Open Interest",
    "Chart Setup & Indicators", "Stop-Loss & Trailing", "Exit & Target Management",
    "Trading Checklists", "Uncategorized"
]
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024

def connect():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    return c

def init_db():
    LIBRARY.mkdir(exist_ok=True); BACKUPS.mkdir(exist_ok=True)
    with connect() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS categories(
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)""")
        c.execute("""CREATE TABLE IF NOT EXISTS images(
            id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, original_name TEXT NOT NULL,
            title TEXT NOT NULL, description TEXT DEFAULT '', tags TEXT DEFAULT '',
            category_id INTEGER, favorite INTEGER NOT NULL DEFAULT 0, sha256 TEXT NOT NULL,
            created_at TEXT NOT NULL, FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL)""")
        for name in DEFAULT_CATEGORIES:
            c.execute("INSERT OR IGNORE INTO categories(name,created_at) VALUES(?,?)",
                      (name, datetime.now().isoformat(timespec="seconds")))

def file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""): h.update(chunk)
    return h.hexdigest()

def all_categories():
    with connect() as c:
        return [dict(r) for r in c.execute("SELECT * FROM categories ORDER BY name COLLATE NOCASE")]

def image_dict(r):
    d = dict(r); d["tags_list"] = [x.strip() for x in (d.get("tags") or "").split(",") if x.strip()]
    d["url"] = "/library/" + d["filename"]
    return d

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/library")
def api_library():
    q = request.args.get("q", "").strip()
    cat = request.args.get("category", "").strip()
    fav = request.args.get("favorites", "") == "1"
    with connect() as c:
        sql = """SELECT images.*, categories.name AS category FROM images
                 LEFT JOIN categories ON categories.id=images.category_id WHERE 1=1"""
        args = []
        if q:
            like = f"%{q}%"
            sql += " AND (images.title LIKE ? OR images.description LIKE ? OR images.tags LIKE ? OR images.original_name LIKE ? OR categories.name LIKE ?)"
            args += [like, like, like, like, like]
        if cat:
            sql += " AND images.category_id=?"; args.append(int(cat))
        if fav: sql += " AND images.favorite=1"
        sql += " ORDER BY images.created_at DESC, images.id DESC"
        images = [image_dict(r) for r in c.execute(sql, args)]
        cats = [dict(r) for r in c.execute("""SELECT categories.*, COUNT(images.id) AS image_count
             FROM categories LEFT JOIN images ON images.category_id=categories.id
             GROUP BY categories.id ORDER BY categories.name COLLATE NOCASE""")]
    return jsonify({"images": images, "categories": cats, "total": len(images)})

@app.post("/api/images")
def upload_images():
    uploads = request.files.getlist("files")
    category_id = request.form.get("category_id", "").strip()
    added, skipped, errors = [], [], []
    with connect() as c:
        for f in uploads:
            if not f or not f.filename: continue
            original = Path(f.filename).name
            ext = Path(original).suffix.lower()
            if ext not in ALLOWED:
                errors.append(f"{original}: unsupported file type"); continue
            temp = ROOT / (".upload_" + secure_filename(original))
            f.save(temp)
            digest = file_hash(temp)
            duplicate = c.execute("SELECT id FROM images WHERE sha256=?", (digest,)).fetchone()
            if duplicate:
                temp.unlink(missing_ok=True); skipped.append(original); continue
            stem = secure_filename(Path(original).stem) or "image"
            dest_name = f"{digest[:12]}_{stem}{ext}"
            dest = LIBRARY / dest_name
            shutil.move(str(temp), str(dest))
            title = Path(original).stem.replace("_", " ").replace("-", " ").strip() or "Untitled image"
            catid = int(category_id) if category_id.isdigit() else None
            c.execute("""INSERT INTO images(filename,original_name,title,category_id,sha256,created_at)
                         VALUES(?,?,?,?,?,?)""",
                      (dest_name, original, title, catid, digest, datetime.now().isoformat(timespec="seconds")))
            added.append(title)
    return jsonify({"added": len(added), "skipped": skipped, "errors": errors})

@app.patch("/api/images/<int:image_id>")
def update_image(image_id):
    data = request.get_json(force=True)
    allowed = {"title", "description", "tags", "category_id", "favorite"}
    with connect() as c:
        row = c.execute("SELECT id FROM images WHERE id=?", (image_id,)).fetchone()
        if not row: return jsonify({"error": "Image not found"}), 404
        fields, vals = [], []
        for k in allowed:
            if k in data:
                value = data[k]
                if k == "category_id":
                    value = int(value) if str(value).isdigit() else None
                elif k == "favorite": value = 1 if value else 0
                elif k in {"title", "description", "tags"}: value = str(value).strip()
                fields.append(f"{k}=?"); vals.append(value)
        if fields:
            vals.append(image_id)
            c.execute(f"UPDATE images SET {','.join(fields)} WHERE id=?", vals)
    return jsonify({"ok": True})

@app.delete("/api/images/<int:image_id>")
def delete_image(image_id):
    with connect() as c:
        row = c.execute("SELECT filename FROM images WHERE id=?", (image_id,)).fetchone()
        if not row: return jsonify({"error":"Image not found"}), 404
        # Remove from library only; original source folder was never modified.
        (LIBRARY / row["filename"]).unlink(missing_ok=True)
        c.execute("DELETE FROM images WHERE id=?", (image_id,))
    return jsonify({"ok": True})

@app.post("/api/categories")
def add_category():
    name = (request.get_json(force=True).get("name") or "").strip()
    if not name: return jsonify({"error":"Enter a category name"}), 400
    try:
        with connect() as c:
            c.execute("INSERT INTO categories(name,created_at) VALUES(?,?)",
                      (name, datetime.now().isoformat(timespec="seconds")))
    except sqlite3.IntegrityError:
        return jsonify({"error":"That category already exists"}), 409
    return jsonify({"ok":True})

@app.patch("/api/categories/<int:category_id>")
def rename_category(category_id):
    name = (request.get_json(force=True).get("name") or "").strip()
    if not name: return jsonify({"error":"Enter a category name"}), 400
    try:
        with connect() as c:
            cur = c.execute("UPDATE categories SET name=? WHERE id=?", (name, category_id))
            if not cur.rowcount: return jsonify({"error":"Category not found"}), 404
    except sqlite3.IntegrityError:
        return jsonify({"error":"That category already exists"}), 409
    return jsonify({"ok":True})

@app.delete("/api/categories/<int:category_id>")
def delete_category(category_id):
    with connect() as c:
        cat = c.execute("SELECT name FROM categories WHERE id=?", (category_id,)).fetchone()
        if not cat: return jsonify({"error":"Category not found"}), 404
        count = c.execute("SELECT COUNT(*) FROM images WHERE category_id=?", (category_id,)).fetchone()[0]
        if count:
            return jsonify({"error":f"Move or recategorize its {count} image(s) before deleting this category."}), 409
        c.execute("DELETE FROM categories WHERE id=?", (category_id,))
    return jsonify({"ok":True})

@app.get("/library/<path:filename>")
def serve_library(filename):
    return send_from_directory(LIBRARY, filename)

@app.post("/api/backup")
def backup():
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target = BACKUPS / f"SwingPilot_Backup_{stamp}.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
        if DB.exists(): z.write(DB, "catalog.db")
        for p in LIBRARY.iterdir():
            if p.is_file(): z.write(p, f"library/{p.name}")
        z.writestr("README_BACKUP.txt", "SwingPilot offline library backup. Keep this ZIP safe. To restore, close the app and extract the contents into the application folder, preserving paths.")
    return jsonify({"filename": target.name, "path": str(target.relative_to(ROOT))})

@app.get("/api/categories")
def categories():
    return jsonify(all_categories())

if __name__ == "__main__":
    init_db()
    print("\\nSwingPilot Offline Visual Library is starting...")
    print("Open http://127.0.0.1:8765 in your browser.")
    print("Keep this window open while using the library. Press Ctrl+C to stop.\\n")
    app.run(host="127.0.0.1", port=8765, debug=False)
