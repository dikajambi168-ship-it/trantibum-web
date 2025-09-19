import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;
const JWT_SECRET = "rahasia";
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_PATH = path.join(DATA_DIR, "trantibum.db");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT
);
CREATE TABLE IF NOT EXISTS offense_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT
);
CREATE TABLE IF NOT EXISTS offenses (
  id TEXT PRIMARY KEY,
  offense_type_id INTEGER,
  reporter_id TEXT,
  status TEXT,
  occurred_at TEXT,
  lat REAL, lng REAL,
  description TEXT
);
`);

db.prepare("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?)")
  .run("u1","Admin","admin@trantibum.local","Admin123!","Admin");
db.prepare("INSERT OR IGNORE INTO offense_types (id,code,name) VALUES (1,'TRT01','PKL di trotoar')").run();

app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname,"public")));

function auth(req,res,next){
  const h=req.headers.authorization||"";
  if(!h.startsWith("Bearer ")) return res.status(401).json({error:"Unauthorized"});
  try{
    req.user=jwt.verify(h.slice(7),JWT_SECRET);
    next();
  }catch{res.status(401).json({error:"Invalid token"});}
}

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body;
  const u=db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if(!u||u.password!==password) return res.status(401).json({error:"Login gagal"});
  const token=jwt.sign({id:u.id,role:u.role,name:u.name},JWT_SECRET);
  res.json({token,user:{name:u.name,role:u.role}});
});

app.get("/api/types",auth,(req,res)=>{
  res.json(db.prepare("SELECT * FROM offense_types").all());
});

app.post("/api/types",auth,(req,res)=>{
  const {code,name}=req.body;
  try{
    db.prepare("INSERT INTO offense_types (code,name) VALUES (?,?)").run(code,name);
    res.json({ok:true});
  }catch{res.status(400).json({error:"Kode sudah ada"});}
});

app.post("/api/offenses",auth,(req,res)=>{
  const {offenseTypeId,lat,lng,description}=req.body;
  const id=nanoid();
  db.prepare("INSERT INTO offenses VALUES (?,?,?,?,?,?,?,?)")
    .run(id,offenseTypeId,req.user.id,"Draft",new Date().toISOString(),lat,lng,description);
  res.json({id,description});
});

app.get("/api/offenses",auth,(req,res)=>{
  res.json(db.prepare("SELECT o.*,t.code,t.name as type_name FROM offenses o JOIN offense_types t ON t.id=o.offense_type_id").all());
});

app.listen(PORT,()=>console.log("Jalan di http://localhost:"+PORT));
