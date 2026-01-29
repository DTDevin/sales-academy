/**
 * Lead Generation routes – AI-Recherche, Suche, Anreicherung.
 * All require auth.
 */
import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as leadgenService from '../services/leadgen.service';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/leadgen/options
 * Get available search options (branches, regions)
 */
router.get('/options', async (_req: AuthRequest, res: Response) => {
  const options = leadgenService.getSearchOptions();
  res.json(options);
});

/**
 * POST /api/leadgen/research
 * AI-basierte Lead-Recherche
 */
router.post('/research', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const criteria: leadgenService.LeadSearchCriteria = {
      branche: body.branche as string | undefined,
      region: body.region as string | undefined,
      land: body.land as string | undefined,
      keywords: body.keywords as string | undefined,
      limit: body.limit ? parseInt(String(body.limit), 10) : 10,
    };

    const result = await leadgenService.aiLeadResearch(req.userId!, criteria);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/leadgen/search
 * Lokale Lead-Suche in der Datenbank
 */
router.post('/search', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const criteria: leadgenService.LeadSearchCriteria = {
      branche: body.branche as string | undefined,
      region: body.region as string | undefined,
      land: body.land as string | undefined,
      keywords: body.keywords as string | undefined,
      limit: body.limit ? parseInt(String(body.limit), 10) : 50,
    };

    const result = await leadgenService.searchLeads(req.userId!, criteria);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/leadgen/enrich/:id
 * Einzelnen Lead anreichern
 */
router.post('/enrich/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await leadgenService.enrichLead(req.params.id, req.userId!);
    if (!result) {
      return res.status(404).json({ error: 'Lead nicht gefunden' });
    }
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/leadgen/enrich-batch
 * Mehrere Leads anreichern
 */
router.post('/enrich-batch', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as { leadIds?: string[] };
    if (!Array.isArray(body.leadIds) || body.leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds (Array) erforderlich' });
    }

    const result = await leadgenService.enrichLeadsBatch(body.leadIds, req.userId!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/leadgen/save
 * Generierte Leads speichern
 */
router.post('/save', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as { leads?: leadgenService.GeneratedLead[] };
    if (!Array.isArray(body.leads) || body.leads.length === 0) {
      return res.status(400).json({ error: 'leads (Array) erforderlich' });
    }

    const result = await leadgenService.saveGeneratedLeads(req.userId!, body.leads);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
