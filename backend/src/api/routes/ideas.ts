import { Router } from 'express';
import { IdeasController } from '../controllers/ideasController';
import { IdeaService } from '../../services/ideaService';
import { IdeaRepository } from '../../repositories/ideaRepository';
import { ConfigService } from '../../services/configService';
import { requireAuth } from './auth';

const router = Router();

// Initialize dependencies
const ideaRepository = new IdeaRepository();
const configService = new ConfigService();
const ideaService = new IdeaService(ideaRepository, configService);
const ideasController = new IdeasController(ideaService);

// Public routes (read-only)
router.get('/landing', async (req, res, next) => {
  try {
    const data = await ideaRepository.getLandingData();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});
router.get('/', (req, res, next) => ideasController.getIdeas(req, res, next));
router.get('/:id', (req, res, next) => ideasController.getIdea(req, res, next));
router.get('/:id/history', (req, res, next) => ideasController.getIdeaHistory(req, res, next));

// Protected routes (admin only)
router.put('/:id', requireAuth, (req, res, next) => ideasController.updateIdea(req, res, next));
router.delete('/:id', requireAuth, (req, res, next) => ideasController.deleteIdea(req, res, next));

export default router;
