import mongoose from 'mongoose';
import { config } from '../config/config';
import TopicModel from '../models/topicModel';

const topics = [
  { name: 'Cybersecurity', slug: 'cybersecurity' },
  { name: 'Python', slug: 'python' },
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'Web Development', slug: 'web-development' },
  { name: 'Machine Learning', slug: 'machine-learning' },
  { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
  { name: 'Data Science', slug: 'data-science' },
  { name: 'Cloud Computing', slug: 'cloud-computing' },
  { name: 'DevOps', slug: 'devops' },
  { name: 'Linux', slug: 'linux' },
  { name: 'Open Source', slug: 'open-source' },
  { name: 'Blockchain', slug: 'blockchain' },
  { name: 'Databases', slug: 'databases' },
  { name: 'System Design', slug: 'system-design' },
  { name: 'React', slug: 'react' },
  { name: 'Node.js', slug: 'nodejs' },
  { name: 'Mobile Development', slug: 'mobile-development' },
  { name: 'Game Development', slug: 'game-development' },
  { name: 'Politics', slug: 'politics' },
  { name: 'Economics', slug: 'economics' },
  { name: 'Science', slug: 'science' },
  { name: 'Space', slug: 'space' },
  { name: 'Climate & Environment', slug: 'climate-environment' },
  { name: 'Health & Medicine', slug: 'health-medicine' },
  { name: 'Psychology', slug: 'psychology' },
  { name: 'Philosophy', slug: 'philosophy' },
  { name: 'History', slug: 'history' },
  { name: 'Education', slug: 'education' },
  { name: 'Entrepreneurship', slug: 'entrepreneurship' },
  { name: 'Finance & Investing', slug: 'finance-investing' },
  { name: 'Design', slug: 'design' },
  { name: 'Photography', slug: 'photography' },
  { name: 'Writing', slug: 'writing' },
  { name: 'Books', slug: 'books' },
  { name: 'Music', slug: 'music' },
  { name: 'Film & TV', slug: 'film-tv' },
  { name: 'Gaming', slug: 'gaming' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Travel', slug: 'travel' },
  { name: 'Food & Cooking', slug: 'food-cooking' },
  { name: 'Productivity', slug: 'productivity' },
  { name: 'Self Improvement', slug: 'self-improvement' },
  { name: 'Culture', slug: 'culture' },
  { name: 'Society', slug: 'society' },
];

async function seed() {
  await mongoose.connect(config.DATABASE_URL!);
  console.log('Connected to database');

  await TopicModel.deleteMany({});
  console.log('Cleared existing topics');

  await TopicModel.insertMany(topics);
  console.log(`Seeded ${topics.length} topics`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
