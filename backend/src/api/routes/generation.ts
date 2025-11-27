import { Router } from 'express';
import { GenerationController } from '../controllers/generationController';
import { IdeaGenerationService } from '../../services/ideaGenerationService';
import { IdeaRepository } from '../../repositories/ideaRepository';
import { ConfigService } from '../../services/configService';

const router = Router();

// Initialize dependencies
const ideaRepository = new IdeaRepository();
const configService = new ConfigService();
const generationService = new IdeaGenerationService(ideaRepository, configService);
const generationController = new GenerationController(generationService);

// Routes
router.get('/status', (req, res) => generationController.getGenerationStatus(req, res));
router.post('/generate', (req, res, next) => generationController.generateIdea(req, res, next));

export default router;
