/**
 * Lead routes – CRUD, Import. All require auth; all scoped by user_id.
 */
import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as leadService from '../services/lead.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
    const verifizierungsstatus = req.query.verifizierungsstatus as string | undefined;
    const result = await leadService.listLeads(req.userId!, { limit, offset, verifizierungsstatus });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/branchen', async (_req, res: Response, next) => {
  try {
    const list = await leadService.listBranchen();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/abteilungen', async (_req, res: Response, next) => {
  try {
    const list = await leadService.listAbteilungen();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id, req.userId!);
    if (!lead) return res.status(404).json({ error: 'Lead nicht gefunden' });
    res.json(lead);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const data = {
      firma: body.firma as string | undefined,
      strasse: body.strasse as string | undefined,
      plz: body.plz as string | undefined,
      ort: body.ort as string | undefined,
      land: body.land as string | undefined,
      website: body.website as string | undefined,
      branche_id: body.branche_id as string | undefined,
      ansprechpartner_name: body.ansprechpartner_name as string | undefined,
      abteilung_id: body.abteilung_id as string | undefined,
      email_primary: body.email_primary as string | undefined,
      email_alternativ: body.email_alternativ as string | undefined,
      telefon: body.telefon as string | undefined,
      mobil: body.mobil as string | undefined,
      quelle: body.quelle as string | undefined,
      notizen: body.notizen as string | undefined,
    };
    const lead = await leadService.createLead(req.userId!, data);
    res.status(201).json(lead);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const data = {
      firma: body.firma as string | undefined,
      strasse: body.strasse as string | undefined,
      plz: body.plz as string | undefined,
      ort: body.ort as string | undefined,
      land: body.land as string | undefined,
      website: body.website as string | undefined,
      branche_id: body.branche_id as string | undefined,
      ansprechpartner_name: body.ansprechpartner_name as string | undefined,
      abteilung_id: body.abteilung_id as string | undefined,
      email_primary: body.email_primary as string | undefined,
      email_alternativ: body.email_alternativ as string | undefined,
      telefon: body.telefon as string | undefined,
      mobil: body.mobil as string | undefined,
      verifizierungsstatus: body.verifizierungsstatus as string | undefined,
      notizen: body.notizen as string | undefined,
    };
    const lead = await leadService.updateLead(req.params.id, req.userId!, data);
    if (!lead) return res.status(404).json({ error: 'Lead nicht gefunden' });
    res.json(lead);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const ok = await leadService.deleteLead(req.params.id, req.userId!);
    if (!ok) return res.status(404).json({ error: 'Lead nicht gefunden' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post('/import', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as { rows?: Record<string, string>[]; columnMap?: Record<string, string>; quelle?: string };
    if (!Array.isArray(body.rows) || !body.columnMap || typeof body.columnMap !== 'object') {
      return res.status(400).json({ error: 'rows (Array) und columnMap (Objekt) erforderlich' });
    }
    const result = await leadService.importLeadsCsv(
      req.userId!,
      body.rows,
      body.columnMap,
      body.quelle ?? 'import'
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
