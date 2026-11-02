import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../.data/db.json');
let db = {};
try {
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }
} catch (e) {
  console.error('Error reading db.json:', e);
}

// Import defaults from websiteService
import {
  DEFAULT_WEBSITE_SETTINGS,
  DEFAULT_WEBSITE_SLIDES,
  DEFAULT_WEBSITE_COURSES,
  DEFAULT_WEBSITE_SUBJECTS,
  DEFAULT_WEBSITE_TEACHERS,
  DEFAULT_WEBSITE_GALLERY,
  DEFAULT_WEBSITE_VIDEOS,
  DEFAULT_WEBSITE_NEWS,
  DEFAULT_WEBSITE_TESTIMONIALS,
} from '../src/services/websiteService.js';

// Pre-fill website keys into server database
db.educo_db_website_settings = db.educo_db_website_settings || DEFAULT_WEBSITE_SETTINGS;
db.educo_db_website_slides = db.educo_db_website_slides || DEFAULT_WEBSITE_SLIDES;
db.educo_db_website_courses = db.educo_db_website_courses || DEFAULT_WEBSITE_COURSES;
db.educo_db_website_subjects = db.educo_db_website_subjects || DEFAULT_WEBSITE_SUBJECTS;
db.educo_db_website_teachers = DEFAULT_WEBSITE_TEACHERS; // Use updated teachers with Abdulazizbek's new photo!
db.educo_db_website_gallery = db.educo_db_website_gallery || DEFAULT_WEBSITE_GALLERY;
db.educo_db_website_videos = db.educo_db_website_videos || DEFAULT_WEBSITE_VIDEOS;
db.educo_db_website_news = db.educo_db_website_news || DEFAULT_WEBSITE_NEWS;
db.educo_db_website_testimonials = db.educo_db_website_testimonials || DEFAULT_WEBSITE_TESTIMONIALS;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log('Successfully seeded website keys into .data/db.json!');
