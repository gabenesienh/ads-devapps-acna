import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { usuariosTable } from '../db/schema.ts';

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', async function(req, res, next) {
  const db = drizzle(process.env.DATABASE_URL);
  const result = await db.select().from(usuariosTable);

  res.send(result);
});

module.exports = router;
