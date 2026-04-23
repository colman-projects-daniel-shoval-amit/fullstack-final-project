import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

import UserModel from '../models/userModel';
import PostModel from '../models/postModel';
import CommentModel from '../models/commentModel';
import TopicModel from '../models/topicModel';

const DB_URL = process.env.DATABASE_URL ?? 'mongodb://localhost:27017/finalproj';

// ---------------------------------------------------------------------------
// Topics (full set, absorbed from seedTopics.ts)
// ---------------------------------------------------------------------------
const TOPICS = [
    { name: 'Cybersecurity',          slug: 'cybersecurity' },
    { name: 'Python',                 slug: 'python' },
    { name: 'JavaScript',             slug: 'javascript' },
    { name: 'TypeScript',             slug: 'typescript' },
    { name: 'Web Development',        slug: 'web-development' },
    { name: 'Machine Learning',       slug: 'machine-learning' },
    { name: 'Artificial Intelligence',slug: 'artificial-intelligence' },
    { name: 'Data Science',           slug: 'data-science' },
    { name: 'Cloud Computing',        slug: 'cloud-computing' },
    { name: 'DevOps',                 slug: 'devops' },
    { name: 'Linux',                  slug: 'linux' },
    { name: 'Open Source',            slug: 'open-source' },
    { name: 'Blockchain',             slug: 'blockchain' },
    { name: 'Databases',              slug: 'databases' },
    { name: 'System Design',          slug: 'system-design' },
    { name: 'React',                  slug: 'react' },
    { name: 'Node.js',                slug: 'nodejs' },
    { name: 'Mobile Development',     slug: 'mobile-development' },
    { name: 'Game Development',       slug: 'game-development' },
    { name: 'Politics',               slug: 'politics' },
    { name: 'Economics',              slug: 'economics' },
    { name: 'Science',                slug: 'science' },
    { name: 'Space',                  slug: 'space' },
    { name: 'Climate & Environment',  slug: 'climate-environment' },
    { name: 'Health & Medicine',      slug: 'health-medicine' },
    { name: 'Psychology',             slug: 'psychology' },
    { name: 'Philosophy',             slug: 'philosophy' },
    { name: 'History',                slug: 'history' },
    { name: 'Education',              slug: 'education' },
    { name: 'Entrepreneurship',       slug: 'entrepreneurship' },
    { name: 'Finance & Investing',    slug: 'finance-investing' },
    { name: 'Design',                 slug: 'design' },
    { name: 'Photography',            slug: 'photography' },
    { name: 'Writing',                slug: 'writing' },
    { name: 'Books',                  slug: 'books' },
    { name: 'Music',                  slug: 'music' },
    { name: 'Film & TV',              slug: 'film-tv' },
    { name: 'Gaming',                 slug: 'gaming' },
    { name: 'Sports',                 slug: 'sports' },
    { name: 'Travel',                 slug: 'travel' },
    { name: 'Food & Cooking',         slug: 'food-cooking' },
    { name: 'Productivity',           slug: 'productivity' },
    { name: 'Self Improvement',       slug: 'self-improvement' },
    { name: 'Culture',                slug: 'culture' },
    { name: 'Society',                slug: 'society' },
];

// ---------------------------------------------------------------------------
// Posts with rich Markdown content
// ---------------------------------------------------------------------------
const POSTS: { title: string; text: string; topicSlugs: string[] }[] = [
    {
        title: 'Why TypeScript Is Worth the Setup Cost',
        topicSlugs: ['typescript', 'web-development'],
        text: `# Why TypeScript Is Worth the Setup Cost

Static typing might feel like friction at first, but after a week it becomes the **fastest feedback loop** you have.

## What You Get for Free

- **Autocomplete** that actually knows your data shapes
- Catch *undefined is not a function* before the browser does
- Refactors that propagate across the entire codebase automatically

## A Simple Example

\`\`\`typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'member';
}

function greet(user: User): string {
  return \`Hello, \${user.email}\`;
}
\`\`\`

Try removing \`email\` from the interface — every call site lights up immediately.

## The Real Cost

The overhead is real but front-loaded. Once your \`tsconfig\` is dialled in and your team stops fighting the compiler, velocity goes *up*, not down.

> "TypeScript doesn't slow you down. It slows down the bugs."
`,
    },
    {
        title: 'Designing for Accessibility: Start Here',
        topicSlugs: ['design', 'web-development'],
        text: `# Designing for Accessibility: Start Here

Accessibility is not a checklist item — it's a **design philosophy**. Products built for everyone end up being better for everyone.

## The Non-Negotiables

1. **Color contrast** — WCAG AA requires a 4.5:1 ratio for body text
2. **Keyboard navigation** — every interactive element must be reachable without a mouse
3. **Semantic HTML** — use \`<button>\` not \`<div onClick>\`
4. **Alt text** — every meaningful image needs a description

## Screen Reader Friendly Code

\`\`\`html
<!-- Bad -->
<div class="btn" onclick="submit()">Submit</div>

<!-- Good -->
<button type="submit" aria-label="Submit form">Submit</button>
\`\`\`

## Tools to Test With

- **axe DevTools** — browser extension, catches ~57 % of issues automatically
- **NVDA / VoiceOver** — actually *use* a screen reader for 10 minutes
- Lighthouse accessibility audit (built into Chrome DevTools)

Getting this right from day one is **ten times cheaper** than retrofitting it later.
`,
    },
    {
        title: 'MongoDB Aggregation Pipelines: A Practical Intro',
        topicSlugs: ['databases', 'web-development'],
        text: `# MongoDB Aggregation Pipelines: A Practical Intro

The aggregation pipeline is one of MongoDB's most powerful features, and also one of the most underused.

## What Is a Pipeline?

A pipeline is a **sequence of stages**, each transforming the documents flowing through it.

\`\`\`js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $sort:  { total: -1 } },
  { $limit: 10 }
]);
\`\`\`

## Key Stages

| Stage       | What it does                                  |
|-------------|-----------------------------------------------|
| \`$match\`    | Filters documents (like \`WHERE\` in SQL)       |
| \`$group\`    | Aggregates values across documents            |
| \`$lookup\`   | Left-join with another collection             |
| \`$project\`  | Reshapes the output document                  |
| \`$unwind\`   | Deconstructs an array into separate documents |

## Why Not Just Filter in Node.js?

Because **network I/O is expensive**. Moving 50,000 raw documents to your app server to compute a single sum is wasteful. Push the logic to where the data lives.

---

Start simple with \`$match\` + \`$group\`, then build complexity as you need it.
`,
    },
    {
        title: 'The Hidden Cost of Technical Debt',
        topicSlugs: ['entrepreneurship', 'web-development'],
        text: `# The Hidden Cost of Technical Debt

Every shortcut you take in code has an **interest rate**. Most teams don't feel it until they're paying compounding interest on five years of shortcuts simultaneously.

## What Debt Looks Like in Practice

- A "temporary" workaround that's been in production for three years
- A test suite nobody trusts, so nobody runs it
- *"We'll refactor it after the launch"* — spoiler: you won't

## The Compounding Effect

\`\`\`
Feature velocity at year 1:  ████████████ 100%
Feature velocity at year 3:  ████████     65%
Feature velocity at year 5:  ████         35%
\`\`\`

The codebase doesn't get harder because your team got worse. It gets harder because **every new feature now has to navigate the old ones**.

## What to Do About It

1. **Make it visible** — track debt as explicitly as features
2. **Pay it down incrementally** — allocate 20 % of each sprint to cleanup
3. **Stop accruing more** — agree on standards before you write the code, not after

> "The best time to fix technical debt was yesterday. The second best time is now."
`,
    },
    {
        title: 'Getting Started with Machine Learning: The Mental Model',
        topicSlugs: ['machine-learning', 'artificial-intelligence'],
        text: `# Getting Started with Machine Learning: The Mental Model

Before you write a single line of Python, you need the right mental model. Most beginners get lost because they treat ML as magic rather than **applied statistics**.

## The Core Loop

1. **Collect** labelled data
2. **Choose** a model architecture
3. **Train** — adjust weights to minimise a loss function
4. **Evaluate** on held-out data
5. **Iterate**

## A Minimal Example

\`\`\`python
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = LogisticRegression()
model.fit(X_train, y_train)

preds = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, preds):.2%}")
\`\`\`

## Common Pitfalls

- **Data leakage** — your test set influences your training process
- **Overfitting** — memorising training data instead of learning patterns
- Treating accuracy as the only metric (it lies on imbalanced datasets)

---

The math is learnable. The discipline around *data quality* is where most projects actually succeed or fail.
`,
    },
    {
        title: 'Morning Routines That Actually Stick',
        topicSlugs: ['productivity', 'self-improvement'],
        text: `# Morning Routines That Actually Stick

Every productivity article tells you to wake up at **5 AM**, cold plunge, meditate for an hour, and journal three pages. Most people try it for a week and collapse.

## Why Grand Routines Fail

- They require *willpower* — a finite resource
- One missed day feels like total failure
- They're designed for someone else's life

## The Two-Habit Rule

Pick **exactly two habits**. Attach each one to something you already do (habit stacking).

\`\`\`
After I pour my morning coffee → I write for 10 minutes
After I sit at my desk → I review today's three priorities
\`\`\`

## What Actually Matters

- **Consistency beats intensity** every time
- A 10-minute walk every day beats a 2-hour gym session twice a week
- *Done* is better than *perfect*

> "You do not rise to the level of your goals. You fall to the level of your systems." — James Clear

Start embarrassingly small. The routine that sticks is the one you'll actually do.
`,
    },
    {
        title: 'Cybersecurity Basics Every Developer Should Know',
        topicSlugs: ['cybersecurity', 'web-development'],
        text: `# Cybersecurity Basics Every Developer Should Know

You don't need to be a security engineer to write secure code. You need to know the **OWASP Top 10** and a handful of habits.

## The Biggest Mistakes

### 1. SQL / NoSQL Injection

Never concatenate user input into a query.

\`\`\`js
// Vulnerable
db.users.find({ email: req.body.email });

// Safe — validate and cast types first
const email = z.string().email().parse(req.body.email);
db.users.find({ email });
\`\`\`

### 2. Storing Passwords in Plaintext

Always hash with **bcrypt** (cost factor ≥ 10):

\`\`\`js
const hash = await bcrypt.hash(password, 10);
\`\`\`

### 3. Broken Authentication

- Use short-lived **JWT access tokens** (15 min)
- Rotate **refresh tokens** on every use
- Invalidate tokens on logout (store a denylist or use token families)

## Quick Checklist

- [ ] Input validation on every endpoint (use Zod or Joi)
- [ ] HTTPS everywhere
- [ ] Dependency audit: \`npm audit\` in CI
- [ ] Secrets in environment variables, never in source code
- [ ] Rate-limit authentication endpoints

Security is not a feature you add later — it's a habit you build now.
`,
    },
    {
        title: 'System Design 101: Scaling a Web App',
        topicSlugs: ['system-design', 'cloud-computing'],
        text: `# System Design 101: Scaling a Web App

Most apps don't need to scale to millions of users. But understanding *how* they would helps you make better decisions at every size.

## The Journey

\`\`\`
Single server  →  Separate DB  →  Read replicas  →  Cache layer  →  Horizontal scaling
\`\`\`

## Key Concepts

### Vertical vs Horizontal Scaling

| Approach    | What it means           | Limit              |
|-------------|-------------------------|--------------------|
| Vertical    | Bigger machine          | Hardware ceiling   |
| Horizontal  | More machines           | Complexity ceiling |

### Caching

Put **Redis** in front of expensive queries. Cache invalidation is hard — start with simple TTL-based expiry.

\`\`\`
Request → Cache hit?  → Yes → Return cached response
                      → No  → Query DB → Store in cache → Return response
\`\`\`

### The Database Bottleneck

The database is almost always the first bottleneck. Before you add servers, add:

1. Proper **indexes** on your most common queries
2. A **read replica** for analytics/reporting traffic
3. **Connection pooling** (don't open a new connection per request)

---

**Don't pre-optimise.** Build the simplest thing that works, measure, then scale the part that's actually slow.
`,
    },
    {
        title: 'Exploring Lisbon: A City That Rewards the Curious',
        topicSlugs: ['travel', 'culture'],
        text: `# Exploring Lisbon: A City That Rewards the Curious

Lisbon is one of those rare cities that feels **entirely itself** — not performing for tourists, not trying to be Paris.

## What Makes It Special

- The *miradouros* (viewpoints) that open without warning at the top of narrow tiled streets
- Pastel de nata at 8 AM for €1.20, standing at a counter
- The late afternoon light, which is genuinely unlike anywhere else in Europe

## Getting Around

Don't rent a car. The 28 tram is a cliché for a reason — **take it anyway**, just not at peak hours. Walk everywhere you can. The hills are real but the reward is always a view.

## Eating Without the Tourist Tax

> Skip anything within 200 metres of a major landmark.

Find a *tasca* — a tiny neighbourhood restaurant with a handwritten menu and no English translation. Point at what the table next to you is eating.

## A Suggested Day

1. **Morning** — Alfama at sunrise, before the cruise ship crowds arrive
2. **Midday** — Time Out Market (once) then never again; eat in Mouraria instead
3. **Afternoon** — LX Factory on a Sunday, or just walk along the river
4. **Evening** — Fado in Mouraria, not the tourist shows in Alfama

Go in *spring or autumn*. The city is yours.
`,
    },
    {
        title: 'The Gut-Brain Connection: What the Research Actually Says',
        topicSlugs: ['health-medicine', 'science'],
        text: `# The Gut-Brain Connection: What the Research Actually Says

Your gut contains roughly **100 million neurons** — more than your entire spinal cord. Researchers now call it the *enteric nervous system*, or informally, the **second brain**.

## The Vagus Nerve Highway

The gut and brain communicate bidirectionally via the vagus nerve. About **90 % of the signals travel upward** — from gut to brain — which helps explain why gastrointestinal distress so often precedes or accompanies anxiety.

## What Influences the Gut Microbiome

| Factor      | Effect                                          |
|-------------|------------------------------------------------|
| Diet        | Diversity of plants → diversity of microbes    |
| Sleep       | Disruption degrades microbial balance           |
| Stress      | Cortisol alters gut permeability                |
| Antibiotics | Broad-spectrum disruption; recovery takes months|

## What the Evidence Supports (So Far)

- Probiotics show *modest* effects on anxiety and depression in some trials
- High-fibre diets correlate with better mood markers
- The causality question is largely **unresolved** — does gut health affect mental health, or does mental health affect gut health, or both?

## Practical Takeaways

1. Eat **30+ different plants per week** (this counts herbs and spices)
2. Prioritise sleep quality over duration
3. Be sceptical of probiotic supplement marketing — whole food sources are better studied

The field is young. The hype is ahead of the evidence, but the *direction* is clear.
`,
    },
];

const COMMENTS: string[] = [
    'Great post, really enjoyed reading this!',
    'This changed how I think about the topic.',
    'Would love to see a follow-up piece on this.',
    'Well written and very easy to follow.',
    'Shared this with my whole team — thanks.',
    'Some of these points are spot on.',
    'Thanks for putting this together.',
    'Bookmarked for later reference.',
    'The code examples make this so much clearer.',
    'Finally an explanation that makes sense.',
    'Disagree slightly on point 2, but overall solid.',
    'This saved me hours of research.',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], min: number, max: number): T[] {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(count, arr.length));
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
    await mongoose.connect(DB_URL);
    console.log('Connected to', DB_URL);

    await Promise.all([
        UserModel.deleteMany({}),
        PostModel.deleteMany({}),
        CommentModel.deleteMany({}),
        TopicModel.deleteMany({}),
    ]);
    console.log('Collections cleared');

    // Topics
    const topics = await TopicModel.insertMany(TOPICS);
    const topicBySlug = new Map(topics.map(t => [t.slug, t]));
    console.log(`Created ${topics.length} topics`);

    // Users
    const SALT_ROUNDS = 10;
    const mainPassword  = await bcrypt.hash('qwe123',      SALT_ROUNDS);
    const dummyPassword = await bcrypt.hash('password123', SALT_ROUNDS);

    const users = await UserModel.insertMany([
        {
            email: 'jhhojh10@gmail.com',
            password: mainPassword,
            interests: pickMany(topics.map(t => t._id), 3, 6),
        },
        {
            email: 'alice@example.com',
            password: dummyPassword,
            interests: pickMany(topics.map(t => t._id), 2, 4),
        },
        {
            email: 'bob@example.com',
            password: dummyPassword,
            interests: pickMany(topics.map(t => t._id), 2, 4),
        },
        {
            email: 'carol@example.com',
            password: dummyPassword,
            interests: pickMany(topics.map(t => t._id), 2, 4),
        },
    ]);
    console.log(`Created ${users.length} users`);

    // Follow relationships so the main user has a populated Following feed
    const [mainUser, alice, bob] = users;
    mainUser.following.push(
        alice._id as mongoose.Types.ObjectId,
        bob._id  as mongoose.Types.ObjectId,
    );
    alice.followers.push(mainUser._id as mongoose.Types.ObjectId);
    bob.followers.push(mainUser._id  as mongoose.Types.ObjectId);
    await Promise.all([mainUser.save(), alice.save(), bob.save()]);

    // Posts
    const posts = await PostModel.insertMany(
        POSTS.map(({ title, text, topicSlugs }) => ({
            title,
            text,
            authorId: pick(users)._id,
            topics: topicSlugs
                .map(s => topicBySlug.get(s)?._id)
                .filter(Boolean),
            image: '',
        }))
    );
    console.log(`Created ${posts.length} posts`);

    // Comments (2-3 per post), then sync commentsCount
    const commentDocs = posts.flatMap(post =>
        pickMany(COMMENTS, 2, 3).map(content => ({
            postId: post._id,
            authorId: pick(users)._id,
            content,
        }))
    );
    const comments = await CommentModel.insertMany(commentDocs);

    const countMap = new Map<string, number>();
    for (const c of comments) {
        const key = c.postId.toString();
        countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    await Promise.all(
        [...countMap.entries()].map(([postId, count]) =>
            PostModel.findByIdAndUpdate(postId, { commentsCount: count })
        )
    );
    console.log(`Created ${comments.length} comments`);

    console.log('\nSeed complete!');
    console.log('  Login: jhhojh10@gmail.com / qwe123');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
