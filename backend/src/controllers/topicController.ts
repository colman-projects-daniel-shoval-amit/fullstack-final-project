import TopicModel from '../models/topicModel';
import BaseController from './baseController';

class TopicController extends BaseController {
  constructor() {
    super(TopicModel);
  }
}

export default new TopicController();
