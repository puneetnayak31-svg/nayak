/**
 * Copywriting helpers for the offline Brand Bible writer.
 *
 * Two jobs: understand the brief (turn "A mithai shop in Jaipur selling
 * handmade sweets and festive gift boxes" into category "mithai shop", offer
 * "handmade sweets and festive gift boxes", place "Jaipur"), so no field ever
 * pastes the brief back verbatim; and give each sector its own vocabulary
 * (promise, call to action, hashtags, beliefs, content ideas) so launch copy
 * reads like it was written for that business on that platform.
 */
import { COMMON_WORDS, EVOCATIVE_WORDS, INDIAN_ROOTS, detectSector, hash32, rng, toSlug, type Sector } from '@gbt/shared';

export interface BriefSense {
  /** Short noun phrase: "mithai shop", "streetwear label". */
  category: string;
  /** What it sells or makes, when the brief says so. */
  offer?: string;
  /** City or region named in the brief. */
  place?: string;
  /** Who it's for, when the brief says so. */
  audience?: string;
  sector: Sector;
}

const LEAD = /^(i'?m|i am|we'?re|we are|i want|we want|it'?s|this is)\s+(building|creating|making|launching|starting|opening|to build|to start|to launch|to open)?\s*/i;
const CUT = /\s+(?:for|that|which|who|selling|sells|making|makes|offering|offers|with|helping|helps|to|where|from|in|on)\s+|,|;|—|-\s/i;

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) && !/^(I|AI|UPI|SaaS)\b/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s);

/** Read the brief into parts. Never returns the whole sentence as one field. */
export function understandBrief(description: string, industry?: string): BriefSense {
  const raw = description.trim().replace(/\.$/, '').replace(LEAD, '').replace(/^(a|an|the)\s+/i, '');
  const sector = detectSector({ description: raw, industry });
  const head = raw.split(CUT)[0]!.trim();
  const words = head.split(/\s+/);
  const category = lowerFirst(words.slice(-4).join(' ')) || 'new brand';

  const offerMatch = raw.match(/\b(?:selling|sells|making|makes|offering|offers|serving|serves|with)\s+(.+?)(?=\s+(?:for|to|in|from|across|at|on)\s+|,|;|$)/i);
  const placeMatch = raw.match(/\b(?:in|from|across|based in)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/);
  const audienceMatch = raw.match(/\bfor\s+(.+?)(?=\s+(?:in|from|across|who|that|with)\s+|,|;|$)/i);
  const offer = offerMatch?.[1]?.trim();
  return {
    category,
    offer: offer && offer.split(/\s+/).length <= 9 ? offer : undefined,
    place: placeMatch?.[1],
    audience: audienceMatch?.[1]?.trim(),
    sector,
  };
}

interface SectorVoice {
  /** Who to write for when the brief doesn't say. */
  audience: string;
  emoji: string;
  /** Short promise, lower case, no full stop. */
  promise: string;
  /** What the brand does, as a verb phrase for "We ___". */
  verb: string;
  cta: string;
  hashtags: string[];
  /** One sentence: what's wrong in the category today. */
  problem: string;
  beliefs: [string, string, string];
  youtube: string;
  ideas: string[];
}

export const SECTOR_VOICE: Record<Sector, SectorVoice> = {
  coffee: { audience: 'everyday coffee and chai lovers', emoji: '☕', promise: 'good cups, no fuss', verb: 'brew and pour', cta: 'Find your cup', hashtags: ['coffee', 'specialtycoffee', 'chai', 'cafe'], problem: 'Most cups are either rushed or overpriced.', beliefs: ['Fresh beats fancy', 'Every cup should taste like someone cared', 'Good coffee should be easy to get'], youtube: 'Brewing guides, origin stories and slow mornings', ideas: ['Reel: the pour, in slow motion', 'Carousel: how we pick our beans or leaves', 'Story poll: hot or iced?', 'Reel: a regular’s order, explained', 'Post: meet the roaster / chaiwala behind the counter', 'Carousel: 3 brew mistakes and the fix', 'Short: 15-second recipe of the week', 'Story: what’s on the menu today', 'Post: the mug you’ll want to steal', 'Reel: a day in the café in 20 seconds'] },
  fashion: { audience: 'people who care what they wear', emoji: '🧵', promise: 'clothes that feel like you', verb: 'design and make clothes', cta: 'Shop the first drop', hashtags: ['streetwear', 'slowfashion', 'ootd', 'indiandesigners'], problem: 'Fast fashion is cheap for a reason, and it shows after three washes.', beliefs: ['Fewer, better pieces', 'Fit first, trend second', 'Know who made your clothes'], youtube: 'Lookbooks, styling ideas and behind-the-seams', ideas: ['Reel: one piece, three ways to wear it', 'Carousel: fabric close-ups and why we chose them', 'Story: vote on the next colourway', 'Reel: from sketch to sample', 'Post: the drop, flat-lay', 'Carousel: size guide that actually helps', 'Reel: customer fit-check', 'Story: packing your orders', 'Post: care tips so it lasts', 'Reel: the studio playlist and the people'] },
  sweets: { audience: 'families, gifters and anyone with a sweet tooth', emoji: '🍬', promise: 'sweets worth the wait', verb: 'make sweets by hand', cta: 'Order your box', hashtags: ['mithai', 'indiansweets', 'festivegifting', 'handmade'], problem: 'Festive boxes look grand but taste like they sat on a shelf for weeks.', beliefs: ['Made fresh, in small batches', 'Ghee, sugar and patience, nothing else', 'A gift box should feel like a hug'], youtube: 'Kitchen stories, family recipes and festive specials', ideas: ['Reel: kaju katli being cut, ASMR', 'Carousel: what goes into one box', 'Story: which sweet is your childhood favourite?', 'Reel: the karigar who has made laddoos for 20 years', 'Post: the festive gift box, unboxed', 'Carousel: how to keep mithai fresh', 'Reel: packing 100 boxes for Diwali', 'Story: today’s fresh batch', 'Post: corporate gifting, made personal', 'Reel: one sweet, its story in 20 seconds'] },
  bakery: { audience: 'neighbours who love fresh bread', emoji: '🥐', promise: 'baked fresh, every morning', verb: 'bake every morning', cta: 'Pre-order today', hashtags: ['bakery', 'freshbaked', 'sourdough', 'homebaker'], problem: 'Bread shouldn’t need a list of preservatives to last.', beliefs: ['Flour, water, time', 'Fresh or not at all', 'The best ingredient is patience'], youtube: 'Bakes, recipes and early-morning kitchen tours', ideas: ['Reel: the 5 a.m. oven reveal', 'Carousel: our flours, explained', 'Story: what’s fresh today', 'Reel: one dough, four bakes', 'Post: the cake of the week', 'Carousel: how to store bread properly', 'Reel: piping in slow motion', 'Story: sold out? Here’s tomorrow', 'Post: custom cake orders are open', 'Reel: meet the bakers'] },
  candles: { audience: 'people who make home a ritual', emoji: '🕯️', promise: 'slow evenings, bottled', verb: 'pour candles by hand', cta: 'Find your scent', hashtags: ['candles', 'soywax', 'homefragrance', 'selfcare'], problem: 'Most candles smell of chemicals and burn out in a week.', beliefs: ['Clean wax, honest scents', 'A good candle changes the room', 'Small batches, long burns'], youtube: 'Pouring days, scent notes and cosy-home ideas', ideas: ['Reel: the pour, close-up', 'Carousel: notes in each scent', 'Story: which mood are you today?', 'Reel: first light of a new jar', 'Post: the gift set, styled', 'Carousel: candle care in 4 tips', 'Reel: from wax flakes to finished jar', 'Story: restock countdown', 'Post: reuse your jar, 3 ideas', 'Reel: a cosy evening, 15 seconds'] },
  beauty: { audience: 'anyone building a simple routine', emoji: '🧴', promise: 'skin that feels like yours again', verb: 'make skincare that works', cta: 'Find your routine', hashtags: ['skincare', 'cleanbeauty', 'skincareindia', 'glowingskin'], problem: 'Shelves are full of promises and empty of proof.', beliefs: ['Ingredients you can read', 'Results you can see', 'Routines that fit a real morning'], youtube: 'Routines, ingredient breakdowns and honest reviews', ideas: ['Reel: texture swatch, up close', 'Carousel: what each ingredient does', 'Story: quiz, find your skin type', 'Reel: a 60-second morning routine', 'Post: the hero product, styled', 'Carousel: myths about your skin', 'Reel: real results, 4 weeks', 'Story: ask our formulator', 'Post: what we leave out and why', 'Reel: unboxing the starter kit'] },
  beverage: { audience: 'people who want a better sip', emoji: '🥤', promise: 'something better to sip', verb: 'make drinks worth sipping', cta: 'Grab a can', hashtags: ['drinks', 'refreshing', 'madeinindia', 'cheers'], problem: 'Most drinks are sugar with a label.', beliefs: ['Real ingredients you can taste', 'Less sugar, more flavour', 'Made to share'], youtube: 'Flavour drops, mixes and behind-the-brew', ideas: ['Reel: the crack and pour', 'Carousel: what’s inside each flavour', 'Story: which flavour next?', 'Reel: 3 mocktails with one can', 'Post: the range, lined up', 'Carousel: label decoded', 'Reel: brewing day', 'Story: where to find us', 'Post: summer pack is here', 'Reel: taste test with strangers'] },
  food: { audience: 'hungry people who want real food', emoji: '🍛', promise: 'real food, right on time', verb: 'cook food people come back for', cta: 'Order now', hashtags: ['foodie', 'homestyle', 'indianfood', 'foodlover'], problem: 'Delivery food often arrives late, cold and forgettable.', beliefs: ['Cooked fresh, not reheated', 'Recipes with a story', 'On time, every time'], youtube: 'Kitchen stories, recipes and the people who cook them', ideas: ['Reel: the tadka moment', 'Carousel: inside today’s thali', 'Story: what should we add to the menu?', 'Reel: from kitchen to door in 30 minutes', 'Post: the signature dish', 'Carousel: our spices and where they come from', 'Reel: meet the chef', 'Story: today’s special', 'Post: lunch for the office', 'Reel: first bite reactions'] },
  jewellery: { audience: 'people who buy pieces to keep', emoji: '💍', promise: 'pieces you’ll keep for good', verb: 'craft jewellery by hand', cta: 'See the collection', hashtags: ['jewellery', 'handcrafted', 'finejewellery', 'indianjewellery'], problem: 'Fine jewellery often feels either costly or careless.', beliefs: ['Made to be worn, not stored', 'Craft you can feel', 'Honest metal, honest prices'], youtube: 'Making-of films, styling and the stories behind each piece', ideas: ['Reel: a piece being set, close-up', 'Carousel: how to stack', 'Story: gold or silver?', 'Reel: from sketch to sparkle', 'Post: the new collection', 'Carousel: care for your pieces', 'Reel: gifting, wrapped', 'Story: behind the bench', 'Post: wedding season edit', 'Reel: one piece, three looks'] },
  pet: { audience: 'pet parents', emoji: '🐾', promise: 'happier pets, easier days', verb: 'make things pets love', cta: 'Spoil your pet', hashtags: ['dogsofinstagram', 'catsofinstagram', 'petlovers', 'petcare'], problem: 'Pet products are made for shelves, not for pets.', beliefs: ['Pets first, always', 'Ingredients you’d eat yourself', 'Tested by tails'], youtube: 'Pet tips, product tests and very good boys', ideas: ['Reel: the taste test', 'Carousel: what’s in our treats', 'Story: post your pet', 'Reel: unboxing by a dog', 'Post: pet of the week', 'Carousel: 5 signs of a happy pet', 'Reel: the team’s pets at work', 'Story: vet tip Tuesday', 'Post: new flavour', 'Reel: zoomies compilation'] },
  fitness: { audience: 'people who want to move more', emoji: '💪', promise: 'move more, think less', verb: 'help people move', cta: 'Book your first class', hashtags: ['fitness', 'workout', 'fitnessindia', 'healthylifestyle'], problem: 'Most fitness plans quit on you before you quit on them.', beliefs: ['Consistency over intensity', 'Strong is for everyone', 'Progress you can feel'], youtube: 'Workouts, form checks and real progress stories', ideas: ['Reel: 30-second form fix', 'Carousel: a week of training', 'Story: what’s your goal?', 'Reel: member transformation, with permission', 'Post: class schedule', 'Carousel: myths about rest days', 'Reel: coach’s warm-up', 'Story: daily challenge', 'Post: new programme', 'Reel: the gym at 6 a.m.'] },
  education: { audience: 'curious learners', emoji: '📚', promise: 'learning that actually sticks', verb: 'teach things that stick', cta: 'Start learning', hashtags: ['learning', 'education', 'studytips', 'upskill'], problem: 'Courses are long, dull and easy to abandon.', beliefs: ['Short lessons, real skills', 'Learn by doing', 'Every learner learns differently'], youtube: 'Bite-sized lessons and study tips', ideas: ['Reel: one concept in 30 seconds', 'Carousel: a cheat sheet', 'Story: quiz of the day', 'Reel: student result story', 'Post: new course announcement', 'Carousel: common mistakes', 'Reel: teacher’s tip', 'Story: ask me anything', 'Post: learning path', 'Reel: before and after a lesson'] },
  health: { audience: 'patients and their families', emoji: '🩺', promise: 'care that listens', verb: 'look after people', cta: 'Book a visit', hashtags: ['health', 'wellness', 'healthcare', 'selfcare'], problem: 'Care often feels rushed, confusing and hard to book.', beliefs: ['Listen first', 'Explain everything plainly', 'Care doesn’t end at the appointment'], youtube: 'Clear health explainers from people who care', ideas: ['Reel: a myth, busted by our doctor', 'Carousel: when to see a doctor', 'Story: health question box', 'Reel: tour of the clinic', 'Post: meet the team', 'Carousel: prepare for your visit', 'Reel: a 30-second habit', 'Story: timings and booking', 'Post: patient story, with consent', 'Reel: what happens at a check-up'] },
  fintech: { audience: 'people who want money to make sense', emoji: '💸', promise: 'money that makes sense', verb: 'make money simpler', cta: 'Get started free', hashtags: ['fintech', 'personalfinance', 'moneytips', 'upi'], problem: 'Money tools are full of fine print and empty of clarity.', beliefs: ['No hidden fees, ever', 'Plain words about money', 'Your data is yours'], youtube: 'Money explained in plain words', ideas: ['Reel: a money myth in 20 seconds', 'Carousel: how fees really work', 'Story: what do you save for?', 'Reel: product walk-through', 'Post: security, explained', 'Carousel: budgeting in 4 steps', 'Reel: founder on why we built it', 'Story: feature drop', 'Post: customer win', 'Reel: one tip, every Monday'] },
  tech: { audience: 'busy teams', emoji: '⚡', promise: 'less busywork, more done', verb: 'build software that saves time', cta: 'Try it free', hashtags: ['startup', 'saas', 'buildinpublic', 'productivity'], problem: 'Teams lose hours every week to work a tool could do for them.', beliefs: ['Software should save time, not take it', 'Ship small, ship often', 'Listen to the people who use it'], youtube: 'Product demos, build-in-public updates and how-tos', ideas: ['Reel: the 30-second demo', 'Carousel: before vs after the workflow', 'Story: what should we build next?', 'Post: changelog highlights', 'Carousel: 5 ways teams use it', 'Reel: founder build-in-public update', 'Post: customer story', 'Short: keyboard shortcut of the week', 'Carousel: the problem in numbers (real data only)', 'Reel: behind the launch'] },
  creator: { audience: 'curious viewers and listeners', emoji: '🎬', promise: 'stories worth your time', verb: 'make things worth watching', cta: 'Watch the latest', hashtags: ['creator', 'contentcreator', 'youtube', 'podcast'], problem: 'Feeds are full; attention is scarce.', beliefs: ['Make it worth the minute', 'Honest over viral', 'Community before numbers'], youtube: 'New episodes, behind the scenes and community picks', ideas: ['Short: the best 30 seconds of the latest episode', 'Carousel: key takeaways', 'Story: pick next week’s topic', 'Reel: behind the scenes of a shoot', 'Post: guest announcement', 'Carousel: tools we use', 'Reel: bloopers', 'Story: Q&A', 'Post: milestone thanks (real numbers only)', 'Reel: a day of making content'] },
  realestate: { audience: 'home buyers and renters', emoji: '🏡', promise: 'homes, found without the hassle', verb: 'help people find homes', cta: 'See listings', hashtags: ['realestate', 'dreamhome', 'homesweethome', 'property'], problem: 'Finding a home means endless calls, visits and surprises.', beliefs: ['Every listing, honestly described', 'Your time matters', 'Fair advice over fast deals'], youtube: 'Home tours, buying guides and neighbourhood walks', ideas: ['Reel: 30-second home tour', 'Carousel: buying checklist', 'Story: which room matters most?', 'Reel: neighbourhood walk', 'Post: new listing', 'Carousel: documents you need', 'Reel: before and after a renovation', 'Story: open-house timings', 'Post: happy keys handover, with consent', 'Reel: what ₹1 crore gets you here'] },
  services: { audience: 'founders and small teams', emoji: '🤝', promise: 'expert help, plainly given', verb: 'help businesses grow', cta: 'Book a call', hashtags: ['smallbusiness', 'consulting', 'entrepreneur', 'businesstips'], problem: 'Good advice is often buried in jargon and long reports.', beliefs: ['Plain advice beats long decks', 'Results over hours billed', 'Your success is the only metric'], youtube: 'Practical business advice in short videos', ideas: ['Carousel: one framework we use every week', 'Reel: a common mistake and the fix', 'Story: ask us anything', 'Post: case study (with permission)', 'Carousel: checklist for founders', 'Reel: day in the life', 'Post: how we work', 'Short: one tip in 30 seconds', 'Carousel: myths in our field', 'Post: team introduction'] },
  retail: { audience: 'people who shop thoughtfully', emoji: '🛍️', promise: 'good things, delivered', verb: 'bring good things to your door', cta: 'Shop now', hashtags: ['shoplocal', 'madeinindia', 'giftideas', 'shopsmall'], problem: 'Online shopping is endless choice and very little care.', beliefs: ['Fewer, better things', 'Packed with care', 'Real people answer your messages'], youtube: 'Unboxings, product stories and gift guides', ideas: ['Reel: unboxing the bestseller', 'Carousel: gift guide', 'Story: this or that?', 'Reel: packing an order', 'Post: new arrivals', 'Carousel: how it’s made', 'Reel: customer review, with permission', 'Story: restock alert', 'Post: behind the brand', 'Reel: styling the product at home'] },
  general: { audience: 'early adopters', emoji: '✦', promise: 'something worth your time', verb: 'make something useful', cta: 'Say hello', hashtags: ['newbrand', 'launch', 'smallbusiness', 'madeinindia'], problem: 'Most options feel generic and impersonal.', beliefs: ['Do one thing really well', 'Plain words, real people', 'Listen, then build'], youtube: 'What we make, how we make it and why', ideas: ['Reel: what we do in 20 seconds', 'Carousel: why we started', 'Story: what do you want from us?', 'Reel: behind the scenes', 'Post: meet the founder', 'Carousel: how it works', 'Reel: first customer story', 'Story: Q&A', 'Post: what’s next', 'Reel: a day with the team'] },
};

const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const articled = (p: string) => (/^(the|a|an)\s/i.test(p) ? p : /^[aeiou]/i.test(p) ? `an ${p}` : `a ${p}`);
const fit = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);

const STEMS = new Set(['thread', 'kettle', 'spice', 'sweet', 'brew', 'bake', 'glow', 'spark', 'bloom', 'craft', 'stitch', 'pour', 'leaf', 'bean', 'loom', 'silk', 'cotton', 'petal', 'nest', 'paw', 'move', 'learn', 'mint', 'coin', 'nook', 'root', 'wick', 'hive', 'crumb', 'dough', 'sip', 'fizz', 'bite', 'knot', 'weave', 'shine', 'gem']);

/** Everyday Hindi roots founders often build names from. */
const HINDI_ROOTS: Array<{ root: string; meaning: string }> = [
  { root: 'mitha', meaning: 'sweetness, in Hindi' },
  { root: 'chai', meaning: 'tea, the national habit' },
  { root: 'ghar', meaning: 'home, in Hindi' },
  { root: 'rang', meaning: 'colour, in Hindi' },
  { root: 'sona', meaning: 'gold, in Hindi' },
  { root: 'khush', meaning: 'happiness, in Hindi' },
  { root: 'kala', meaning: 'art, in Sanskrit' },
  { root: 'dhaga', meaning: 'thread, in Hindi' },
  { root: 'swad', meaning: 'taste, in Hindi' },
  { root: 'roshni', meaning: 'light, in Hindi' },
];

/** A word hidden in the name ("Threadly" → thread) or an Indian root with its meaning, for one line of wordplay. */
export function nameHook(name: string): { stem?: string; root?: { root: string; meaning: string } } {
  const lower = name.toLowerCase().replace(/[^a-z]/g, '');
  const root = [...HINDI_ROOTS, ...INDIAN_ROOTS].find((r) => r.root.length >= 4 && lower.startsWith(r.root.toLowerCase()));
  if (root) return { root: { root: root.root, meaning: root.meaning } };
  for (let len = lower.length - 1; len >= 4; len--) {
    const stem = lower.slice(0, len);
    for (const w of [stem, `${stem}e`]) if (STEMS.has(w) || COMMON_WORDS.has(w) || EVOCATIVE_WORDS.has(w)) return { stem: w };
  }
  return {};
}

export interface LaunchInput {
  name: string;
  sense: BriefSense;
  audience: string;
  geo: string;
  domain: string;
  handle: string;
  tone: [string, string, string];
}

/**
 * Launch copy written natively for each platform: lengths, rhythm and calls to
 * action follow the platform; words come from the brand's category, offer,
 * place and sector, never from pasting the brief.
 */
export function launchCopy(i: LaunchInput) {
  const { name, sense } = i;
  const v = SECTOR_VOICE[sense.sector];
  const r = rng(hash32(`launch:${name}:${sense.category}`));
  const pick = <T,>(xs: T[]): T => xs[Math.floor(r() * xs.length) % xs.length]!;
  const where = sense.place ?? (i.geo === 'Global' ? '' : i.geo);
  const what = sense.offer ?? sense.category;
  const tag = toSlug(name).replace(/-/g, '');
  const local = where ? [toSlug(where).replace(/-/g, '')] : [];
  const hashtags = [...new Set([tag, ...v.hashtags, ...local, i.geo === 'India' ? 'madeinindia' : 'smallbusiness'])].slice(0, 7).map((h) => `#${h}`);
  const tone = i.tone.map((t) => t.toLowerCase());
  const hook = nameHook(name);
  // One line of wordplay built from the name itself, so two names never get the same launch copy.
  const nameLine = hook.stem
    ? pick([`${cap(hook.stem)} by ${hook.stem}.`, `It all starts with ${articled(hook.stem)}.`, `More ${hook.stem}, less fuss.`])
    : hook.root
      ? `${name} comes from “${hook.root.root}”: ${hook.root.meaning}.`
      : pick([`${name}. Say it once, remember it.`, `Say hello to ${name}.`, `${name}, at your service.`]);

  const instagram = fit(
    [
      `${v.emoji} ${cap(sense.category)}${where ? ` · ${where}` : ''}`,
      pick([`${cap(v.promise)}.`, nameLine, `${cap(v.promise)}. Made with care.`]),
      `↓ ${v.cta}`,
    ].join('\n'),
    150,
  );
  const x = fit(
    pick([
      `${cap(v.promise)}. ${cap(articled(sense.category))}${where ? ` from ${where}` : ''}. ${v.emoji}`,
      `We ${v.verb}${where ? ` in ${where}` : ''}. ${cap(v.promise)}.`,
      `${name} = ${v.promise}. ${cap(tone[0]!)}, ${tone[1]}, always ${tone[2]}.`,
      `${nameLine} ${cap(v.promise)}. ${v.emoji}`,
    ]),
    160,
  );
  const linkedin = `${name} is ${articled(sense.category)}${where ? ` based in ${where}` : ''}. ${sense.offer ? `We make ${sense.offer}` : `We ${v.verb}`} for ${i.audience}. Our promise is simple: ${v.promise}. ${v.beliefs[0]}; ${v.beliefs[1].toLowerCase()}.`;
  const youtube = `${v.youtube} from ${name}. Expect ${tone[0]} episodes made for ${i.audience}${where ? `, straight from ${where}` : ''}. New videos every ${pick(['week', 'Friday', 'Tuesday'])}. Subscribe if you like ${v.promise}.`;

  const igPost = [
    pick([`${v.emoji} It’s here.`, `${nameLine} ${v.emoji}`, `We’ve been keeping a secret ${v.emoji}`]),
    '',
    `${name} is ${articled(sense.category)}${where ? ` from ${where}` : ''}${sense.offer ? `: ${sense.offer}` : ''}.`,
    `${v.problem} We wanted ${v.promise}, so we started ${name}.`,
    '',
    `${v.cta}, link in bio.`,
    '',
    hashtags.join(' '),
  ].join('\n');

  const liPost = [
    `Today we’re launching ${name}.`,
    '',
    v.problem,
    '',
    `So we built ${articled(sense.category)}${sense.offer ? ` for ${sense.offer}` : ''}${where ? ` in ${where}` : ''}, made for ${i.audience}.`,
    '',
    'What we believe:',
    ...v.beliefs.map((b) => `• ${b}`),
    '',
    `${nameLine} If that sounds like you, ${v.cta.toLowerCase()} at ${i.domain}. And if you know someone who’d love it, a share means the world to a new team.`,
  ].join('\n');

  const xThread = [
    fit(`${name} is live ${v.emoji} ${cap(v.promise)}. A quick thread on why we built it 🧵`, 270),
    fit(v.problem, 270),
    fit(`So we made ${articled(sense.category)}${sense.offer ? `: ${sense.offer}` : ''}${where ? `, from ${where}` : ''}.`, 270),
    fit(`What’s different:\n${v.beliefs.map((b) => `✓ ${b}`).join('\n')}`, 270),
    fit(`${v.cta} → ${i.domain}. Replies are open; tell us what you’d want from ${name}.`, 270),
  ];

  const announcement = `${name} launches today${where ? ` in ${where}` : ''}: ${articled(sense.category)}${sense.offer ? ` offering ${sense.offer}` : ''} for ${i.audience}. ${cap(v.promise)}. ${v.cta} at ${i.domain}.`;

  return {
    bios: { instagram, x, linkedin, youtube },
    posts: { instagram: igPost, linkedin: liPost, xThread, announcement },
    contentIdeas: v.ideas.slice(0, 10),
    hashtags,
  };
}
