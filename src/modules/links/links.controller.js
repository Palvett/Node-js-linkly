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
