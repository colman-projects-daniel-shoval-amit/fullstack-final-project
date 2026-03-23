import { Router } from 'express';
import topicController from '../controllers/topicController';

const topicRouter = Router();

topicRouter.get('/', topicController.get.bind(topicController));
topicRouter.get('/:id', topicController.getById.bind(topicController));

export default topicRouter;
