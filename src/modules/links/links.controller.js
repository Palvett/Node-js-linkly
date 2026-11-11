import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as service from './links.service.js';

export async function createLink(req, res) {
  const link = await service.createLink(req.validated.body);
  res.status(201).json(link);
}

export async function getLink(req, res) {
  const { code } = req.validated.params;
  res.json(await service.getLink(code));
}

export async function deleteLink(req, res) {
  const { code } = req.validated.params;
  await service.deleteLink(code);
  res.status(204).end();
}

export async function listClicks(req, res) {
  const { code } = req.validated.params;
  res.json(await service.listClicks(code, req.validated.query));
}

export async function redirect(req, res) {
  const { code } = req.validated.params;
  const target = await service.recordClick(code, {
    referrer: req.get('referer'),
    user_agent: req.get('user-agent'),
  });
  res.redirect(302, target);
}

// This part quote every cell, double any quotes, and neutralise spreadsheet formulas
const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

async function* csvRows(code) {
  yield 'id,clicked_at,referrer,user_agent\n';
  let after;
  do {
    const { items, next_cursor } = await service.listClicks(code, { after, limit: 100 });
    for (const c of items) {
      yield [c.id, c.clicked_at, c.referrer, c.user_agent].map(csvCell).join(',') + '\n';
    }
    after = next_cursor;
  } while (after !== null);
}

export async function exportClicksCsv(req, res) {
  const { code } = req.validated.params;
  await service.getLink(code); // throws 404 before any headers are sent
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${code}-clicks.csv"`);
  await pipeline(Readable.from(csvRows(code)), res);
}
