/**
 * Maps task title keywords/phrases to suggested emojis.
 * Checked against the lowercase title. First match wins.
 * More specific phrases come before generic single words.
 */

type EmojiRule = { keywords: string[]; emoji: string };

const EMOJI_RULES: EmojiRule[] = [
  // ── Morning / routine ──────────────────────────────────
  { keywords: ['morning routine'], emoji: '🌅' },
  { keywords: ['wake up', 'get up', 'alarm'], emoji: '⏰' },
  { keywords: ['brush teeth', 'floss'], emoji: '🪥' },
  { keywords: ['shower', 'bath', 'bathe'], emoji: '🚿' },
  { keywords: ['skincare', 'moisturize', 'face wash', 'sunscreen'], emoji: '🧴' },
  { keywords: ['get dressed', 'outfit', 'get ready'], emoji: '👔' },
  { keywords: ['make bed', 'bed'], emoji: '🛏️' },

  // ── Food & drink ───────────────────────────────────────
  { keywords: ['breakfast'], emoji: '🍳' },
  { keywords: ['lunch'], emoji: '🥗' },
  { keywords: ['dinner', 'have dinner', 'cook dinner'], emoji: '🍽️' },
  { keywords: ['meal prep', 'prep meals'], emoji: '🥘' },
  { keywords: ['snack'], emoji: '🍎' },
  { keywords: ['grocery', 'groceries', 'supermarket'], emoji: '🛒' },
  { keywords: ['cook', 'cooking', 'recipe'], emoji: '👨‍🍳' },
  { keywords: ['bake', 'baking'], emoji: '🧁' },
  { keywords: ['coffee', 'espresso', 'latte'], emoji: '☕' },
  { keywords: ['tea'], emoji: '🍵' },
  { keywords: ['drink water', 'hydrate', 'water'], emoji: '💧' },
  { keywords: ['smoothie', 'juice'], emoji: '🥤' },
  { keywords: ['protein', 'shake'], emoji: '🥛' },
  { keywords: ['vitamins', 'supplements'], emoji: '💊' },

  // ── Exercise & fitness ─────────────────────────────────
  { keywords: ['go to gym', 'hit the gym', 'gym session'], emoji: '🏋️' },
  { keywords: ['workout', 'work out', 'exercise', 'training'], emoji: '💪' },
  { keywords: ['run', 'running', 'jog', 'jogging'], emoji: '🏃' },
  { keywords: ['walk', 'walking', 'go for a walk', 'stroll'], emoji: '🚶' },
  { keywords: ['hike', 'hiking', 'trail'], emoji: '🥾' },
  { keywords: ['bike', 'biking', 'cycling', 'cycle'], emoji: '🚴' },
  { keywords: ['swim', 'swimming', 'pool'], emoji: '🏊' },
  { keywords: ['yoga', 'stretch', 'stretching'], emoji: '🧘' },
  { keywords: ['meditate', 'meditation', 'mindfulness'], emoji: '🧘' },
  { keywords: ['pushup', 'push-up', 'push up'], emoji: '🫳' },
  { keywords: ['abs', 'core', 'plank'], emoji: '🏋️' },
  { keywords: ['cardio'], emoji: '❤️‍🔥' },
  { keywords: ['gym'], emoji: '🏋️' },
  { keywords: ['sport', 'sports'], emoji: '⚽' },
  { keywords: ['basketball'], emoji: '🏀' },
  { keywords: ['tennis'], emoji: '🎾' },
  { keywords: ['soccer', 'football'], emoji: '⚽' },
  { keywords: ['golf'], emoji: '⛳' },

  // ── Work & productivity ────────────────────────────────
  { keywords: ['start work', 'begin work', 'work time'], emoji: '💼' },
  { keywords: ['meeting', 'standup', 'stand-up', 'sync', 'call'], emoji: '📞' },
  { keywords: ['email', 'emails', 'inbox', 'respond to'], emoji: '📧' },
  { keywords: ['presentation', 'slides', 'deck'], emoji: '📊' },
  { keywords: ['report', 'document', 'docs'], emoji: '📄' },
  { keywords: ['deadline', 'due date', 'submit'], emoji: '⏳' },
  { keywords: ['review', 'code review', 'pr review'], emoji: '🔍' },
  { keywords: ['brainstorm', 'ideate', 'ideas'], emoji: '💡' },
  { keywords: ['plan', 'planning', 'plan your day', 'schedule'], emoji: '📋' },
  { keywords: ['focus', 'deep work', 'focus time'], emoji: '🎯' },
  { keywords: ['write', 'writing', 'blog', 'article', 'draft'], emoji: '✍️' },
  { keywords: ['code', 'coding', 'program', 'programming', 'develop'], emoji: '💻' },
  { keywords: ['design', 'figma', 'mockup', 'wireframe'], emoji: '🎨' },
  { keywords: ['test', 'testing', 'qa', 'debug'], emoji: '🧪' },
  { keywords: ['deploy', 'release', 'ship', 'launch'], emoji: '🚀' },
  { keywords: ['research', 'investigate', 'look into'], emoji: '🔬' },
  { keywords: ['interview'], emoji: '🤝' },
  { keywords: ['project'], emoji: '📁' },
  { keywords: ['task', 'tasks', 'to-do', 'todo'], emoji: '✅' },
  { keywords: ['work'], emoji: '💼' },

  // ── Study & learning ───────────────────────────────────
  { keywords: ['study', 'studying', 'homework', 'assignment'], emoji: '📚' },
  { keywords: ['read', 'reading', 'book'], emoji: '📖' },
  { keywords: ['learn', 'learning', 'course', 'tutorial'], emoji: '🎓' },
  { keywords: ['practice', 'practise'], emoji: '🔄' },
  { keywords: ['class', 'lecture', 'lesson'], emoji: '🏫' },
  { keywords: ['exam', 'test', 'quiz'], emoji: '📝' },
  { keywords: ['flashcard', 'review notes', 'notes'], emoji: '🗒️' },
  { keywords: ['language', 'duolingo', 'vocab'], emoji: '🗣️' },
  { keywords: ['podcast', 'listen'], emoji: '🎧' },

  // ── Cleaning & home ────────────────────────────────────
  { keywords: ['clean', 'cleaning', 'tidy', 'tidy up', 'quick tidy'], emoji: '🧹' },
  { keywords: ['vacuum', 'hoover'], emoji: '🧹' },
  { keywords: ['laundry', 'wash clothes', 'washing'], emoji: '🧺' },
  { keywords: ['dishes', 'wash dishes', 'dishwasher'], emoji: '🍽️' },
  { keywords: ['mop', 'mopping'], emoji: '🪣' },
  { keywords: ['trash', 'garbage', 'take out trash', 'bins'], emoji: '🗑️' },
  { keywords: ['organize', 'organise', 'declutter', 'sort'], emoji: '📦' },
  { keywords: ['fix', 'repair', 'maintenance'], emoji: '🔧' },
  { keywords: ['garden', 'gardening', 'plants', 'water plants', 'mow'], emoji: '🌱' },
  { keywords: ['move', 'pack', 'packing', 'unpack'], emoji: '📦' },

  // ── Shopping & errands ─────────────────────────────────
  { keywords: ['shop', 'shopping', 'buy', 'purchase', 'order'], emoji: '🛍️' },
  { keywords: ['pharmacy', 'medicine', 'prescription'], emoji: '💊' },
  { keywords: ['pick up', 'pickup', 'collect'], emoji: '📬' },
  { keywords: ['return', 'exchange'], emoji: '↩️' },
  { keywords: ['bank', 'banking', 'deposit', 'transfer'], emoji: '🏦' },
  { keywords: ['post office', 'mail', 'package', 'ship'], emoji: '📦' },
  { keywords: ['appointment', 'doctor', 'dentist', 'checkup'], emoji: '🏥' },
  { keywords: ['haircut', 'barber', 'salon'], emoji: '💇' },
  { keywords: ['car wash', 'oil change', 'mechanic'], emoji: '🚗' },
  { keywords: ['gas', 'fuel', 'petrol'], emoji: '⛽' },
  { keywords: ['errand', 'errands'], emoji: '🏃' },

  // ── Health & self-care ─────────────────────────────────
  { keywords: ['sleep', 'nap', 'rest', 'bedtime', 'go to bed'], emoji: '😴' },
  { keywords: ['journal', 'journaling', 'diary'], emoji: '📓' },
  { keywords: ['therapy', 'therapist', 'counseling'], emoji: '🧠' },
  { keywords: ['breathe', 'breathing', 'breath work'], emoji: '🌬️' },
  { keywords: ['gratitude', 'grateful'], emoji: '🙏' },
  { keywords: ['affirmation', 'affirmations'], emoji: '💜' },
  { keywords: ['relax', 'unwind', 'chill'], emoji: '🛋️' },
  { keywords: ['self-care', 'self care', 'pamper'], emoji: '🧖' },
  { keywords: ['weigh', 'weight', 'scale'], emoji: '⚖️' },
  { keywords: ['track', 'log', 'record'], emoji: '📊' },

  // ── Social & family ────────────────────────────────────
  { keywords: ['call mom', 'call dad', 'call parent', 'call family'], emoji: '👨‍👩‍👧' },
  { keywords: ['call friend', 'catch up', 'hang out'], emoji: '📱' },
  { keywords: ['date', 'date night'], emoji: '❤️' },
  { keywords: ['birthday', 'party'], emoji: '🎂' },
  { keywords: ['gift', 'present'], emoji: '🎁' },
  { keywords: ['wedding', 'anniversary'], emoji: '💍' },
  { keywords: ['babysit', 'kids', 'children', 'playdate'], emoji: '👶' },
  { keywords: ['pet', 'dog', 'walk dog', 'feed dog'], emoji: '🐕' },
  { keywords: ['cat', 'feed cat'], emoji: '🐱' },
  { keywords: ['vet'], emoji: '🏥' },

  // ── Finance ────────────────────────────────────────────
  { keywords: ['budget', 'budgeting', 'finances', 'financial'], emoji: '💰' },
  { keywords: ['pay', 'payment', 'bill', 'bills', 'rent', 'invoice'], emoji: '💳' },
  { keywords: ['save', 'saving', 'savings'], emoji: '🐷' },
  { keywords: ['invest', 'investing', 'stocks'], emoji: '📈' },
  { keywords: ['tax', 'taxes'], emoji: '🧾' },

  // ── Entertainment & hobbies ────────────────────────────
  { keywords: ['movie', 'film', 'watch', 'netflix', 'tv', 'show'], emoji: '🎬' },
  { keywords: ['music', 'guitar', 'piano', 'instrument', 'sing'], emoji: '🎵' },
  { keywords: ['game', 'gaming', 'play'], emoji: '🎮' },
  { keywords: ['draw', 'drawing', 'sketch', 'paint', 'painting', 'art'], emoji: '🎨' },
  { keywords: ['photo', 'photography', 'camera'], emoji: '📸' },
  { keywords: ['craft', 'diy', 'knit', 'sew', 'crochet'], emoji: '🧶' },
  { keywords: ['puzzle', 'crossword', 'sudoku'], emoji: '🧩' },

  // ── Travel & transport ─────────────────────────────────
  { keywords: ['travel', 'trip', 'vacation', 'holiday'], emoji: '✈️' },
  { keywords: ['flight', 'airport', 'fly'], emoji: '✈️' },
  { keywords: ['hotel', 'booking', 'reservation'], emoji: '🏨' },
  { keywords: ['pack', 'packing', 'suitcase'], emoji: '🧳' },
  { keywords: ['passport', 'visa'], emoji: '🛂' },
  { keywords: ['commute', 'drive', 'driving'], emoji: '🚗' },
  { keywords: ['bus', 'train', 'subway', 'metro', 'transit'], emoji: '🚃' },
  { keywords: ['uber', 'lyft', 'taxi', 'cab'], emoji: '🚕' },

  // ── Technology ─────────────────────────────────────────
  { keywords: ['update', 'upgrade', 'install'], emoji: '⬆️' },
  { keywords: ['backup', 'back up'], emoji: '💾' },
  { keywords: ['password', 'security'], emoji: '🔒' },
  { keywords: ['wifi', 'internet', 'network'], emoji: '📶' },
  { keywords: ['charge', 'charging', 'battery'], emoji: '🔋' },
  { keywords: ['phone'], emoji: '📱' },
  { keywords: ['computer', 'laptop'], emoji: '💻' },
  { keywords: ['print', 'printer'], emoji: '🖨️' },

  // ── Misc common tasks ──────────────────────────────────
  { keywords: ['check', 'verify', 'confirm'], emoji: '✅' },
  { keywords: ['send', 'message', 'text', 'reply'], emoji: '💬' },
  { keywords: ['sign', 'signature'], emoji: '✒️' },
  { keywords: ['donate', 'charity', 'volunteer'], emoji: '🤲' },
  { keywords: ['pray', 'prayer', 'church', 'mosque', 'temple'], emoji: '🙏' },
  { keywords: ['celebrate', 'celebration'], emoji: '🎉' },
  { keywords: ['move out', 'moving'], emoji: '🚚' },
  { keywords: ['recycle', 'recycling'], emoji: '♻️' },

  // ── Outdoor & nature ─────────────────────────────────
  { keywords: ['beach', 'ocean', 'sea', 'surf', 'surfing'], emoji: '🏖️' },
  { keywords: ['camping', 'camp', 'campfire'], emoji: '🏕️' },
  { keywords: ['fish', 'fishing'], emoji: '🎣' },
  { keywords: ['climb', 'climbing', 'boulder', 'bouldering'], emoji: '🧗' },
  { keywords: ['ski', 'skiing', 'snowboard', 'snowboarding'], emoji: '⛷️' },
  { keywords: ['sunrise', 'sunset', 'watch sunrise'], emoji: '🌅' },
  { keywords: ['picnic'], emoji: '🧺' },
  { keywords: ['park', 'nature walk', 'forest', 'woods'], emoji: '🌲' },

  // ── Creative & content ───────────────────────────────
  { keywords: ['record', 'recording', 'studio'], emoji: '🎙️' },
  { keywords: ['edit video', 'video editing', 'vlog'], emoji: '🎥' },
  { keywords: ['stream', 'streaming', 'live stream'], emoji: '📡' },
  { keywords: ['youtube', 'upload'], emoji: '▶️' },
  { keywords: ['social media', 'instagram', 'tiktok', 'post'], emoji: '📲' },
  { keywords: ['newsletter', 'email list'], emoji: '📰' },
  { keywords: ['script', 'screenplay'], emoji: '🎬' },
  { keywords: ['edit', 'editing', 'proofread'], emoji: '✏️' },

  // ── Parenting & childcare ────────────────────────────
  { keywords: ['school drop', 'drop off kids', 'school pickup'], emoji: '🏫' },
  { keywords: ['homework help', 'help with homework'], emoji: '📐' },
  { keywords: ['pack lunch', 'school lunch', 'lunchbox'], emoji: '🍱' },
  { keywords: ['storytime', 'read to kids', 'bedtime story'], emoji: '📖' },
  { keywords: ['diaper', 'nappy', 'feed baby', 'bottle'], emoji: '🍼' },
  { keywords: ['playground', 'play outside'], emoji: '🛝' },
  { keywords: ['tutor', 'tutoring'], emoji: '👩‍🏫' },

  // ── Automotive ───────────────────────────────────────
  { keywords: ['tire', 'tires', 'tyre'], emoji: '🛞' },
  { keywords: ['inspection', 'mot', 'smog check'], emoji: '🔍' },
  { keywords: ['insurance', 'renew insurance'], emoji: '🛡️' },
  { keywords: ['registration', 'dmv', 'license'], emoji: '🪪' },
  { keywords: ['park car', 'parking'], emoji: '🅿️' },

  // ── Seasonal & weather ───────────────────────────────
  { keywords: ['snow', 'shovel snow', 'de-ice'], emoji: '❄️' },
  { keywords: ['rake', 'raking', 'leaves'], emoji: '🍂' },
  { keywords: ['spring clean', 'spring cleaning'], emoji: '🌸' },
  { keywords: ['halloween', 'costume'], emoji: '🎃' },
  { keywords: ['christmas', 'xmas', 'holiday decor', 'decorate'], emoji: '🎄' },
  { keywords: ['thanksgiving', 'turkey'], emoji: '🦃' },
  { keywords: ['new year', 'resolution', 'resolutions'], emoji: '🎆' },
  { keywords: ['valentines', 'valentine'], emoji: '💝' },
  { keywords: ['easter', 'egg hunt'], emoji: '🐣' },

  // ── Legal & admin ────────────────────────────────────
  { keywords: ['contract', 'agreement', 'lease'], emoji: '📑' },
  { keywords: ['notary', 'notarize'], emoji: '📜' },
  { keywords: ['lawyer', 'attorney', 'legal'], emoji: '⚖️' },
  { keywords: ['paperwork', 'forms', 'application'], emoji: '📝' },
  { keywords: ['file', 'filing'], emoji: '🗂️' },

  // ── Home improvement ─────────────────────────────────
  { keywords: ['paint room', 'paint walls', 'repaint'], emoji: '🖌️' },
  { keywords: ['assemble', 'ikea', 'furniture'], emoji: '🪑' },
  { keywords: ['plumber', 'plumbing', 'leak', 'faucet'], emoji: '🔧' },
  { keywords: ['electrician', 'electrical', 'wiring', 'outlet'], emoji: '⚡' },
  { keywords: ['roof', 'gutter', 'gutters'], emoji: '🏠' },
  { keywords: ['install', 'mount', 'hang'], emoji: '🔨' },
  { keywords: ['measure', 'measuring'], emoji: '📏' },

  // ── Wellness & body ──────────────────────────────────
  { keywords: ['massage', 'spa'], emoji: '💆' },
  { keywords: ['acupuncture', 'chiropractor'], emoji: '🩺' },
  { keywords: ['eye exam', 'optometrist', 'glasses', 'contacts'], emoji: '👓' },
  { keywords: ['dermatologist', 'skin check'], emoji: '🩺' },
  { keywords: ['blood test', 'lab work', 'bloodwork'], emoji: '🩸' },
  { keywords: ['physical', 'annual checkup', 'health check'], emoji: '🏥' },
  { keywords: ['cold plunge', 'ice bath', 'sauna'], emoji: '🧊' },

  // ── Beverages & treats ───────────────────────────────
  { keywords: ['wine', 'beer', 'cocktail', 'drinks', 'happy hour'], emoji: '🍷' },
  { keywords: ['bubble tea', 'boba'], emoji: '🧋' },
  { keywords: ['dessert', 'cake', 'ice cream', 'chocolate'], emoji: '🍰' },
  { keywords: ['brunch'], emoji: '🥂' },
  { keywords: ['sushi', 'ramen', 'noodle'], emoji: '🍜' },
  { keywords: ['pizza'], emoji: '🍕' },
  { keywords: ['burger', 'bbq', 'grill', 'grilling', 'barbecue'], emoji: '🍔' },
  { keywords: ['taco', 'tacos', 'mexican'], emoji: '🌮' },

  // ── Community & social ───────────────────────────────
  { keywords: ['meetup', 'networking', 'event'], emoji: '🤝' },
  { keywords: ['book club'], emoji: '📚' },
  { keywords: ['mentor', 'mentoring', 'coaching'], emoji: '🧭' },
  { keywords: ['presentation night', 'public speaking', 'speech', 'toast'], emoji: '🎤' },
  { keywords: ['reunion', 'gathering', 'get together'], emoji: '👥' },

  // ── Digital cleanup ──────────────────────────────────
  { keywords: ['unsubscribe', 'clean inbox', 'inbox zero'], emoji: '📭' },
  { keywords: ['delete photos', 'organize photos', 'photo album'], emoji: '🖼️' },
  { keywords: ['clear downloads', 'clean desktop', 'disk space'], emoji: '🧹' },
  { keywords: ['cancel subscription', 'cancel membership'], emoji: '🚫' },
  { keywords: ['two factor', '2fa', 'authenticator'], emoji: '🔐' },

  // ── Relationship & romance ───────────────────────────
  { keywords: ['flowers', 'bouquet'], emoji: '💐' },
  { keywords: ['love letter', 'write letter', 'card'], emoji: '💌' },
  { keywords: ['surprise', 'plan surprise'], emoji: '🎉' },
  { keywords: ['proposal', 'propose'], emoji: '💍' },
  { keywords: ['couples', 'couple time', 'quality time'], emoji: '💑' },

  // ── Mindset & goals ──────────────────────────────────
  { keywords: ['vision board', 'goal setting', 'set goals'], emoji: '🎯' },
  { keywords: ['habit', 'habits', 'habit tracker'], emoji: '📊' },
  { keywords: ['reflect', 'reflection', 'review week', 'weekly review'], emoji: '🪞' },
  { keywords: ['manifest', 'manifestation', 'visualize'], emoji: '✨' },
  { keywords: ['morning pages', 'free write', 'freewrite'], emoji: '📝' },
  { keywords: ['digital detox', 'screen time', 'no phone'], emoji: '📵' },

  // ── Music practice ───────────────────────────────────
  { keywords: ['drum', 'drums', 'drumming'], emoji: '🥁' },
  { keywords: ['violin', 'cello', 'viola'], emoji: '🎻' },
  { keywords: ['choir', 'singing', 'vocal'], emoji: '🎤' },
  { keywords: ['band practice', 'rehearsal', 'jam session'], emoji: '🎸' },
  { keywords: ['compose', 'songwrite', 'songwriting'], emoji: '🎼' },

  // ── Emergency & safety ───────────────────────────────
  { keywords: ['fire extinguisher', 'smoke detector', 'carbon monoxide'], emoji: '🧯' },
  { keywords: ['first aid', 'emergency kit', 'cpr'], emoji: '🩹' },
  { keywords: ['locksmith', 'keys', 'spare key'], emoji: '🔑' },
  { keywords: ['evacuation', 'emergency plan'], emoji: '🚨' },

  // ── Pets expanded ────────────────────────────────────
  { keywords: ['groom dog', 'grooming', 'pet groomer'], emoji: '🐩' },
  { keywords: ['fish tank', 'aquarium', 'feed fish'], emoji: '🐟' },
  { keywords: ['bird', 'parrot', 'feed bird'], emoji: '🦜' },
  { keywords: ['hamster', 'guinea pig', 'rabbit', 'bunny'], emoji: '🐹' },
  { keywords: ['litter box', 'cat litter'], emoji: '🐱' },
  { keywords: ['dog park', 'dog training'], emoji: '🦮' },

  // ── Spiritual & mindful ──────────────────────────────
  { keywords: ['fast', 'fasting', 'intermittent fasting'], emoji: '🕐' },
  { keywords: ['yoga class', 'hot yoga', 'pilates'], emoji: '🧘' },
  { keywords: ['tai chi', 'qigong'], emoji: '🥋' },
  { keywords: ['sound bath', 'singing bowl'], emoji: '🔔' },
  { keywords: ['retreat', 'silent retreat'], emoji: '🏔️' },

  // ── Board & tabletop ─────────────────────────────────
  { keywords: ['board game', 'board games', 'game night'], emoji: '🎲' },
  { keywords: ['chess'], emoji: '♟️' },
  { keywords: ['poker', 'card game', 'cards'], emoji: '🃏' },
  { keywords: ['dungeons', 'dnd', 'd&d', 'tabletop'], emoji: '🐉' },

  // ── Sports expanded ────────────────────────────────────
  { keywords: ['baseball', 'softball'], emoji: '⚾' },
  { keywords: ['volleyball'], emoji: '🏐' },
  { keywords: ['hockey', 'ice hockey'], emoji: '🏒' },
  { keywords: ['ping pong', 'table tennis'], emoji: '🏓' },
  { keywords: ['badminton', 'shuttlecock'], emoji: '🏸' },
  { keywords: ['bowling'], emoji: '🎳' },
  { keywords: ['cricket'], emoji: '🏏' },
  { keywords: ['rugby'], emoji: '🏉' },
  { keywords: ['lacrosse'], emoji: '🥍' },
  { keywords: ['archery'], emoji: '🏹' },
  { keywords: ['rowing', 'crew', 'kayak', 'canoe'], emoji: '🚣' },
  { keywords: ['skateboard', 'skateboarding', 'skate'], emoji: '🛹' },
  { keywords: ['ice skating', 'roller skating', 'skating'], emoji: '⛸️' },
  { keywords: ['surfing', 'surf'], emoji: '🏄' },
  { keywords: ['wrestling'], emoji: '🤼' },
  { keywords: ['fencing'], emoji: '🤺' },

  // ── Dance & martial arts ───────────────────────────────
  { keywords: ['dance', 'dancing', 'ballet', 'salsa', 'hip hop dance'], emoji: '💃' },
  { keywords: ['boxing', 'kickboxing', 'mma', 'muay thai'], emoji: '🥊' },
  { keywords: ['karate', 'martial arts', 'judo', 'jiu jitsu', 'bjj'], emoji: '🥋' },

  // ── Food expanded ──────────────────────────────────────
  { keywords: ['pasta', 'spaghetti', 'italian'], emoji: '🍝' },
  { keywords: ['curry', 'indian'], emoji: '🍛' },
  { keywords: ['chinese', 'stir fry', 'wok', 'dim sum', 'dumplings'], emoji: '🥡' },
  { keywords: ['sandwich', 'sub', 'wrap'], emoji: '🥪' },
  { keywords: ['steak', 'beef'], emoji: '🥩' },
  { keywords: ['seafood', 'shrimp', 'lobster', 'crab'], emoji: '🦐' },
  { keywords: ['soup', 'stew', 'chili'], emoji: '🍲' },
  { keywords: ['bread', 'sourdough', 'toast'], emoji: '🍞' },
  { keywords: ['pancake', 'pancakes', 'waffle', 'waffles', 'french toast'], emoji: '🥞' },
  { keywords: ['salad'], emoji: '🥗' },
  { keywords: ['rice', 'fried rice'], emoji: '🍚' },
  { keywords: ['egg', 'eggs', 'omelette', 'omelet'], emoji: '🥚' },
  { keywords: ['chicken', 'wings'], emoji: '🍗' },
  { keywords: ['fries', 'french fries', 'chips'], emoji: '🍟' },
  { keywords: ['hot dog', 'hotdog'], emoji: '🌭' },
  { keywords: ['popcorn'], emoji: '🍿' },
  { keywords: ['donut', 'doughnut'], emoji: '🍩' },
  { keywords: ['cookie', 'cookies', 'biscuit'], emoji: '🍪' },
  { keywords: ['fruit', 'fruits'], emoji: '🍉' },
  { keywords: ['avocado'], emoji: '🥑' },
  { keywords: ['cereal', 'oatmeal', 'porridge'], emoji: '🥣' },

  // ── Tech & dev expanded ────────────────────────────────
  { keywords: ['api', 'backend', 'server', 'endpoint'], emoji: '🖥️' },
  { keywords: ['database', 'sql', 'migration'], emoji: '🗄️' },
  { keywords: ['git', 'commit', 'merge', 'pull request', 'pr'], emoji: '🔀' },
  { keywords: ['ai', 'machine learning', 'ml', 'chatbot'], emoji: '🤖' },
  { keywords: ['bug', 'bugfix', 'fix bug'], emoji: '🐛' },
  { keywords: ['refactor', 'refactoring', 'clean up code'], emoji: '🔧' },
  { keywords: ['zoom', 'video call', 'teams', 'google meet'], emoji: '📹' },
  { keywords: ['slack', 'discord'], emoji: '💬' },
  { keywords: ['spreadsheet', 'excel', 'google sheets'], emoji: '📊' },
  { keywords: ['analytics', 'metrics', 'dashboard'], emoji: '📈' },

  // ── Career & professional ──────────────────────────────
  { keywords: ['resume', 'cv', 'cover letter'], emoji: '📄' },
  { keywords: ['certification', 'cert', 'certificate'], emoji: '🏅' },
  { keywords: ['webinar'], emoji: '💻' },
  { keywords: ['workshop'], emoji: '🛠️' },
  { keywords: ['conference', 'summit', 'expo'], emoji: '🎪' },
  { keywords: ['freelance', 'gig', 'side hustle', 'side project'], emoji: '💼' },
  { keywords: ['negotiate', 'negotiation', 'salary'], emoji: '🤝' },
  { keywords: ['onboarding', 'orientation', 'first day'], emoji: '🏢' },
  { keywords: ['promotion', 'raise'], emoji: '🎉' },
  { keywords: ['resign', 'quit', 'two weeks notice'], emoji: '📝' },
  { keywords: ['linkedin', 'portfolio', 'personal brand'], emoji: '🌐' },

  // ── Academic expanded ──────────────────────────────────
  { keywords: ['thesis', 'dissertation', 'paper'], emoji: '📜' },
  { keywords: ['lab', 'laboratory'], emoji: '🔬' },
  { keywords: ['office hours', 'professor'], emoji: '🕐' },
  { keywords: ['group project', 'study group', 'group work'], emoji: '👥' },
  { keywords: ['scholarship', 'financial aid', 'fafsa'], emoji: '🎓' },
  { keywords: ['graduation', 'graduate', 'commencement'], emoji: '🎓' },
  { keywords: ['tuition', 'enrollment', 'register for classes'], emoji: '🏫' },

  // ── Fashion & clothing ─────────────────────────────────
  { keywords: ['tailor', 'alterations', 'hemming'], emoji: '🧵' },
  { keywords: ['iron', 'ironing', 'press clothes'], emoji: '👔' },
  { keywords: ['shoes', 'sneakers', 'boots'], emoji: '👟' },
  { keywords: ['dry cleaning', 'dry cleaner'], emoji: '👗' },
  { keywords: ['wardrobe', 'closet', 'outfit planning'], emoji: '👚' },

  // ── Hobbies expanded ───────────────────────────────────
  { keywords: ['pottery', 'ceramics', 'clay'], emoji: '🏺' },
  { keywords: ['woodwork', 'woodworking', 'carpentry'], emoji: '🪵' },
  { keywords: ['calligraphy', 'lettering'], emoji: '✒️' },
  { keywords: ['origami', 'paper craft'], emoji: '🦢' },
  { keywords: ['magic', 'magic trick'], emoji: '🪄' },
  { keywords: ['model', 'model building', 'lego'], emoji: '🧱' },
  { keywords: ['garden', 'terrarium', 'repot', 'repotting'], emoji: '🪴' },
  { keywords: ['telescope', 'stargazing', 'astronomy', 'star gaze'], emoji: '🔭' },
  { keywords: ['scrapbook', 'scrapbooking'], emoji: '📒' },
  { keywords: ['embroidery', 'cross stitch'], emoji: '🪡' },
  { keywords: ['candle making', 'soap making'], emoji: '🕯️' },

  // ── Delivery & food ordering ───────────────────────────
  { keywords: ['uber eats', 'doordash', 'grubhub', 'food delivery'], emoji: '🛵' },
  { keywords: ['takeout', 'take out', 'take away', 'carry out'], emoji: '🥡' },
  { keywords: ['reservation', 'restaurant', 'dining out', 'eat out'], emoji: '🍽️' },

  // ── Mental health expanded ─────────────────────────────
  { keywords: ['vent', 'venting'], emoji: '😤' },
  { keywords: ['cry', 'crying'], emoji: '😢' },
  { keywords: ['anxiety', 'anxious', 'panic'], emoji: '😰' },
  { keywords: ['self talk', 'positive thinking'], emoji: '💭' },
  { keywords: ['support group', 'group therapy'], emoji: '🫂' },
  { keywords: ['psychiatrist', 'medication review'], emoji: '🩺' },

  // ── Parenting expanded ─────────────────────────────────
  { keywords: ['bath time', 'give bath'], emoji: '🛁' },
  { keywords: ['potty training', 'potty'], emoji: '🚽' },
  { keywords: ['baby shower', 'gender reveal'], emoji: '👶' },
  { keywords: ['soccer practice', 'dance recital', 'little league'], emoji: '🏆' },
  { keywords: ['pta', 'parent teacher', 'school meeting'], emoji: '🏫' },
  { keywords: ['allowance', 'chores'], emoji: '💰' },

  // ── Nature & astronomy ─────────────────────────────────
  { keywords: ['bird watching', 'birding'], emoji: '🦅' },
  { keywords: ['tide pool', 'shell collecting', 'beachcombing'], emoji: '🐚' },
  { keywords: ['volcano', 'hot spring', 'geyser'], emoji: '🌋' },
  { keywords: ['cave', 'caving', 'spelunking'], emoji: '🦇' },
  { keywords: ['meteor shower', 'eclipse', 'full moon'], emoji: '🌙' },
  { keywords: ['whale watching'], emoji: '🐋' },
  { keywords: ['safari', 'wildlife'], emoji: '🦁' },
  { keywords: ['scuba', 'snorkel', 'snorkeling', 'diving'], emoji: '🤿' },

  // ── Moving & logistics ─────────────────────────────────
  { keywords: ['moving truck', 'u-haul', 'rent truck'], emoji: '🚚' },
  { keywords: ['change address', 'forward mail', 'address change'], emoji: '📮' },
  { keywords: ['storage', 'storage unit'], emoji: '📦' },
  { keywords: ['furniture shopping', 'home goods'], emoji: '🛋️' },
  { keywords: ['utility', 'utilities', 'set up internet'], emoji: '🔌' },

  // ── Drinks expanded ────────────────────────────────────
  { keywords: ['matcha'], emoji: '🍵' },
  { keywords: ['kombucha', 'ferment', 'fermented'], emoji: '🫙' },
  { keywords: ['lemonade', 'iced tea'], emoji: '🍋' },
  { keywords: ['energy drink', 'redbull', 'monster'], emoji: '⚡' },
  { keywords: ['hot chocolate', 'cocoa'], emoji: '☕' },

  // ── Volunteering & community ───────────────────────────
  { keywords: ['food bank', 'soup kitchen', 'food drive'], emoji: '🥫' },
  { keywords: ['blood donation', 'donate blood', 'blood drive'], emoji: '🩸' },
  { keywords: ['habitat for humanity', 'build house'], emoji: '🏗️' },
  { keywords: ['clean up', 'beach cleanup', 'park cleanup', 'litter'], emoji: '🌍' },
  { keywords: ['tutor kids', 'teach', 'teaching'], emoji: '👩‍🏫' },
  { keywords: ['fundraiser', 'fundraising', 'bake sale'], emoji: '🎗️' },

  // ── Holiday & cultural expanded ────────────────────────
  { keywords: ['diwali', 'festival of lights'], emoji: '🪔' },
  { keywords: ['hanukkah', 'chanukah', 'menorah'], emoji: '🕎' },
  { keywords: ['ramadan', 'eid', 'iftar'], emoji: '🌙' },
  { keywords: ['lunar new year', 'chinese new year'], emoji: '🧧' },
  { keywords: ['mothers day', "mother's day", 'mom'], emoji: '💐' },
  { keywords: ['fathers day', "father's day", 'dad'], emoji: '👔' },
  { keywords: ['independence day', 'fourth of july', '4th of july', 'fireworks'], emoji: '🎆' },
  { keywords: ['st patricks', "st patrick's", 'saint patrick'], emoji: '☘️' },
  { keywords: ['super bowl', 'game day'], emoji: '🏈' },
  { keywords: ['concert', 'festival', 'live music'], emoji: '🎶' },

  // ── Safety & preparedness ──────────────────────────────
  { keywords: ['earthquake kit', 'disaster prep', 'go bag'], emoji: '🎒' },
  { keywords: ['smoke alarm', 'change batteries'], emoji: '🔋' },
  { keywords: ['home security', 'alarm system', 'doorbell camera'], emoji: '📷' },
  { keywords: ['flood', 'sandbag', 'storm prep'], emoji: '🌊' },

  // ── Miscellaneous expanded ─────────────────────────────
  { keywords: ['nails', 'manicure', 'pedicure'], emoji: '💅' },
  { keywords: ['tattoo', 'piercing'], emoji: '🎨' },
  { keywords: ['teeth whitening', 'braces', 'invisalign', 'orthodontist'], emoji: '😁' },
  { keywords: ['wax', 'waxing', 'laser hair'], emoji: '✨' },
  { keywords: ['tan', 'tanning', 'sunbathe'], emoji: '☀️' },
  { keywords: ['vote', 'voting', 'election', 'ballot'], emoji: '🗳️' },
  { keywords: ['jury duty', 'court'], emoji: '⚖️' },
  { keywords: ['renew', 'renewal'], emoji: '🔄' },
  { keywords: ['thank you', 'thank', 'appreciation'], emoji: '🙏' },
  { keywords: ['apologize', 'apology', 'sorry'], emoji: '💌' },
  { keywords: ['countdown', 'timer'], emoji: '⏱️' },
  { keywords: ['morning walk', 'evening walk', 'night walk'], emoji: '🌇' },
  { keywords: ['deep clean', 'scrub'], emoji: '🧽' },
  { keywords: ['compost', 'composting'], emoji: '♻️' },
  { keywords: ['sewing', 'hem', 'patch'], emoji: '🧵' },
  { keywords: ['return library', 'library', 'borrow'], emoji: '📚' },
  { keywords: ['museum', 'gallery', 'exhibit', 'exhibition'], emoji: '🖼️' },
  { keywords: ['zoo'], emoji: '🦁' },
  { keywords: ['aquarium'], emoji: '🐠' },
  { keywords: ['amusement park', 'theme park', 'roller coaster'], emoji: '🎢' },
  { keywords: ['escape room'], emoji: '🔐' },
  { keywords: ['karaoke'], emoji: '🎤' },
  { keywords: ['trivia', 'quiz night', 'trivia night'], emoji: '🧠' },
  { keywords: ['spa day'], emoji: '🧖' },
  { keywords: ['road trip'], emoji: '🛣️' },
  { keywords: ['carpool', 'car pool'], emoji: '🚗' },
  { keywords: ['babysitter', 'nanny', 'daycare'], emoji: '👶' },
  { keywords: ['tuition payment', 'pay tuition'], emoji: '💳' },
  { keywords: ['tip', 'gratuity'], emoji: '💵' },

  // ── Fitness expanded ───────────────────────────────────
  { keywords: ['squat', 'squats', 'leg day', 'leg press'], emoji: '🦵' },
  { keywords: ['deadlift', 'bench press', 'barbell'], emoji: '🏋️' },
  { keywords: ['pull up', 'pull-up', 'chin up', 'chin-up'], emoji: '💪' },
  { keywords: ['burpee', 'burpees', 'hiit', 'circuit'], emoji: '🔥' },
  { keywords: ['jump rope', 'skipping rope'], emoji: '⏭️' },
  { keywords: ['kettlebell', 'dumbbell', 'free weights'], emoji: '🏋️' },
  { keywords: ['foam roll', 'foam rolling', 'recovery', 'cool down'], emoji: '🧘' },
  { keywords: ['warm up', 'warmup'], emoji: '🔥' },
  { keywords: ['crossfit', 'cross fit'], emoji: '💪' },
  { keywords: ['spin class', 'peloton', 'stationary bike'], emoji: '🚴' },
  { keywords: ['marathon', 'half marathon', '5k', '10k', 'race'], emoji: '🏅' },
  { keywords: ['triathlon'], emoji: '🏊' },
  { keywords: ['calisthenics', 'bodyweight'], emoji: '🤸' },
  { keywords: ['trampoline', 'bounce'], emoji: '🤸' },
  { keywords: ['rock wall', 'indoor climbing'], emoji: '🧗' },
  { keywords: ['elliptical', 'treadmill', 'stairmaster'], emoji: '🏃' },

  // ── Real estate & housing ──────────────────────────────
  { keywords: ['house hunting', 'apartment hunting', 'house search'], emoji: '🏠' },
  { keywords: ['open house', 'house viewing', 'property tour'], emoji: '🏡' },
  { keywords: ['realtor', 'real estate agent', 'broker'], emoji: '🏘️' },
  { keywords: ['mortgage', 'refinance', 'home loan'], emoji: '🏦' },
  { keywords: ['home inspection', 'appraisal'], emoji: '🔍' },
  { keywords: ['closing', 'close on house', 'sign lease'], emoji: '🔑' },
  { keywords: ['housewarming', 'house warming'], emoji: '🏡' },
  { keywords: ['landlord', 'tenant', 'property manager'], emoji: '🏢' },

  // ── Gardening expanded ─────────────────────────────────
  { keywords: ['prune', 'pruning', 'trim hedge', 'hedge'], emoji: '✂️' },
  { keywords: ['fertilize', 'fertilizer', 'mulch', 'mulching'], emoji: '🌱' },
  { keywords: ['weed', 'weeding', 'pull weeds'], emoji: '🌿' },
  { keywords: ['seed', 'seedling', 'sow', 'sowing', 'plant seeds'], emoji: '🌱' },
  { keywords: ['harvest', 'harvesting', 'pick vegetables'], emoji: '🥕' },
  { keywords: ['transplant', 'repot plant'], emoji: '🪴' },
  { keywords: ['compost bin', 'worm farm', 'worm bin'], emoji: '🪱' },
  { keywords: ['lawn', 'lawn care', 'mow lawn', 'edge lawn'], emoji: '🌾' },
  { keywords: ['sprinkler', 'irrigation', 'drip system'], emoji: '💧' },
  { keywords: ['greenhouse', 'grow light', 'indoor garden'], emoji: '🌿' },

  // ── Cooking appliances & techniques ────────────────────
  { keywords: ['slow cooker', 'crockpot', 'crock pot'], emoji: '🍲' },
  { keywords: ['instant pot', 'pressure cooker'], emoji: '♨️' },
  { keywords: ['air fryer', 'air fry'], emoji: '🍟' },
  { keywords: ['marinate', 'marinade', 'brine'], emoji: '🥩' },
  { keywords: ['smoke', 'smoker', 'smoked meat'], emoji: '🔥' },
  { keywords: ['ferment', 'pickle', 'pickling', 'preserve'], emoji: '🫙' },
  { keywords: ['blender', 'food processor'], emoji: '🥤' },
  { keywords: ['microwave'], emoji: '📡' },
  { keywords: ['sous vide'], emoji: '🌡️' },

  // ── Coffee & tea expanded ──────────────────────────────
  { keywords: ['cold brew'], emoji: '🧊' },
  { keywords: ['pour over', 'french press', 'aeropress'], emoji: '☕' },
  { keywords: ['cappuccino', 'americano', 'mocha', 'macchiato'], emoji: '☕' },
  { keywords: ['chai', 'chai latte'], emoji: '🍵' },
  { keywords: ['herbal tea', 'green tea', 'black tea', 'oolong'], emoji: '🍵' },

  // ── World cuisines ─────────────────────────────────────
  { keywords: ['pho', 'vietnamese', 'banh mi'], emoji: '🍜' },
  { keywords: ['bibimbap', 'korean', 'kimchi', 'bulgogi'], emoji: '🍚' },
  { keywords: ['pad thai', 'thai'], emoji: '🍜' },
  { keywords: ['burrito', 'quesadilla', 'enchilada', 'nachos'], emoji: '🌯' },
  { keywords: ['gyoza', 'tempura', 'teriyaki', 'sashimi'], emoji: '🍣' },
  { keywords: ['kebab', 'shawarma', 'falafel', 'hummus', 'pita'], emoji: '🧆' },
  { keywords: ['crepe', 'croissant', 'baguette', 'french'], emoji: '🥐' },
  { keywords: ['bagel'], emoji: '🥯' },
  { keywords: ['muffin', 'scone'], emoji: '🧁' },
  { keywords: ['pie', 'apple pie', 'pumpkin pie'], emoji: '🥧' },
  { keywords: ['brownie', 'fudge'], emoji: '🍫' },
  { keywords: ['pretzel'], emoji: '🥨' },
  { keywords: ['greek', 'gyro', 'souvlaki', 'mediterranean'], emoji: '🫒' },
  { keywords: ['ethiopian', 'injera'], emoji: '🍛' },
  { keywords: ['jamaican', 'jerk chicken', 'caribbean'], emoji: '🌶️' },
  { keywords: ['tapas', 'spanish', 'paella'], emoji: '🥘' },

  // ── Writing expanded ───────────────────────────────────
  { keywords: ['novel', 'fiction', 'nanowrimo'], emoji: '📖' },
  { keywords: ['poetry', 'poem', 'verse'], emoji: '🪶' },
  { keywords: ['memoir', 'autobiography'], emoji: '📕' },
  { keywords: ['essay'], emoji: '📝' },
  { keywords: ['copywriting', 'copy', 'ad copy'], emoji: '✍️' },
  { keywords: ['content writing', 'ghostwrite', 'ghostwriting'], emoji: '✍️' },
  { keywords: ['outline', 'story outline', 'plot'], emoji: '📋' },
  { keywords: ['publish', 'publishing', 'self publish'], emoji: '📚' },

  // ── Music instruments expanded ─────────────────────────
  { keywords: ['ukulele', 'uke'], emoji: '🎸' },
  { keywords: ['bass', 'bass guitar'], emoji: '🎸' },
  { keywords: ['saxophone', 'sax'], emoji: '🎷' },
  { keywords: ['trumpet', 'trombone', 'brass'], emoji: '🎺' },
  { keywords: ['flute', 'clarinet', 'oboe', 'woodwind'], emoji: '🎵' },
  { keywords: ['harmonica'], emoji: '🎵' },
  { keywords: ['keyboard', 'synthesizer', 'synth'], emoji: '🎹' },
  { keywords: ['dj', 'djing', 'turntable', 'mix'], emoji: '🎧' },

  // ── Gaming expanded ────────────────────────────────────
  { keywords: ['playstation', 'ps5', 'ps4', 'xbox', 'console'], emoji: '🎮' },
  { keywords: ['nintendo', 'switch'], emoji: '🎮' },
  { keywords: ['vr', 'virtual reality', 'oculus', 'quest'], emoji: '🥽' },
  { keywords: ['pc gaming', 'steam', 'pc game'], emoji: '🖥️' },
  { keywords: ['esports', 'tournament', 'competitive'], emoji: '🏆' },
  { keywords: ['lan party'], emoji: '🖥️' },
  { keywords: ['minecraft'], emoji: '⛏️' },
  { keywords: ['fortnite', 'apex', 'valorant', 'overwatch'], emoji: '🎯' },
  { keywords: ['zelda', 'mario', 'pokemon'], emoji: '🎮' },
  { keywords: ['retro game', 'retro gaming', 'emulator'], emoji: '👾' },

  // ── Grooming & personal care ───────────────────────────
  { keywords: ['shave', 'shaving', 'razor'], emoji: '🪒' },
  { keywords: ['beard', 'beard trim', 'mustache'], emoji: '🧔' },
  { keywords: ['cologne', 'perfume', 'fragrance'], emoji: '🧴' },
  { keywords: ['deodorant'], emoji: '🧴' },
  { keywords: ['face mask', 'sheet mask', 'clay mask'], emoji: '🧖' },
  { keywords: ['exfoliate', 'scrub face', 'toner', 'serum'], emoji: '🧴' },
  { keywords: ['hair dye', 'color hair', 'highlights', 'balayage'], emoji: '💇' },
  { keywords: ['eyebrow', 'brow', 'lashes', 'eyelash'], emoji: '👁️' },
  { keywords: ['makeup', 'cosmetics', 'foundation', 'mascara'], emoji: '💄' },

  // ── Night & evening routine ────────────────────────────
  { keywords: ['night routine', 'evening routine', 'wind down'], emoji: '🌙' },
  { keywords: ['lights out', 'sleep mask', 'melatonin'], emoji: '😴' },
  { keywords: ['white noise', 'sleep sound', 'sleep app'], emoji: '🔊' },
  { keywords: ['pajamas', 'pjs', 'nightgown'], emoji: '🛏️' },
  { keywords: ['brush hair', 'comb hair'], emoji: '💇' },
  { keywords: ['remove makeup', 'makeup remover', 'cleanse'], emoji: '🧴' },

  // ── Social media expanded ──────────────────────────────
  { keywords: ['tweet', 'twitter', 'x post'], emoji: '🐦' },
  { keywords: ['facebook', 'fb'], emoji: '📲' },
  { keywords: ['pinterest', 'pin'], emoji: '📌' },
  { keywords: ['snapchat', 'snap'], emoji: '👻' },
  { keywords: ['reddit'], emoji: '📲' },
  { keywords: ['content calendar', 'editorial calendar'], emoji: '📅' },
  { keywords: ['reel', 'reels', 'short', 'shorts'], emoji: '🎞️' },
  { keywords: ['thumbnail', 'banner', 'cover photo'], emoji: '🖼️' },

  // ── Financial expanded ─────────────────────────────────
  { keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain'], emoji: '🪙' },
  { keywords: ['retirement', '401k', 'ira', 'pension'], emoji: '🏦' },
  { keywords: ['credit card', 'credit score', 'fico'], emoji: '💳' },
  { keywords: ['debt', 'loan', 'student loan', 'payoff'], emoji: '💸' },
  { keywords: ['expense', 'expenses', 'expense report', 'reimburse'], emoji: '🧾' },
  { keywords: ['dividend', 'portfolio', 'asset'], emoji: '📈' },
  { keywords: ['accountant', 'cpa', 'bookkeeping'], emoji: '🧮' },
  { keywords: ['coupon', 'coupons', 'promo code', 'deal'], emoji: '🏷️' },

  // ── Seasonal activities ────────────────────────────────
  { keywords: ['sledding', 'sled', 'toboggan', 'tubing'], emoji: '🛷' },
  { keywords: ['snowman', 'snowball fight', 'snow angel'], emoji: '⛄' },
  { keywords: ['apple picking', 'orchard'], emoji: '🍎' },
  { keywords: ['pumpkin patch', 'pumpkin picking', 'pumpkin carving'], emoji: '🎃' },
  { keywords: ['corn maze', 'hayride', 'hay ride'], emoji: '🌽' },
  { keywords: ['leaf peeping', 'fall foliage', 'autumn drive'], emoji: '🍁' },
  { keywords: ['ice fishing'], emoji: '🎣' },
  { keywords: ['hot tub', 'jacuzzi'], emoji: '♨️' },
  { keywords: ['bonfire', 'fire pit', 'smores', "s'mores"], emoji: '🔥' },
  { keywords: ['kite', 'fly kite', 'kite flying'], emoji: '🪁' },
  { keywords: ['snowshoeing', 'snowshoe'], emoji: '🥾' },

  // ── Baby & pregnancy ───────────────────────────────────
  { keywords: ['prenatal', 'prenatal appointment', 'ob-gyn', 'obgyn'], emoji: '🤰' },
  { keywords: ['ultrasound', 'sonogram'], emoji: '🤰' },
  { keywords: ['nursery', 'set up nursery', 'crib', 'bassinet'], emoji: '🍼' },
  { keywords: ['stroller', 'car seat'], emoji: '👶' },
  { keywords: ['breastfeed', 'pump', 'breast pump', 'nursing'], emoji: '🍼' },
  { keywords: ['baby food', 'puree', 'formula'], emoji: '🍼' },
  { keywords: ['teething', 'pacifier'], emoji: '👶' },
  { keywords: ['swaddle', 'sleep training'], emoji: '😴' },
  { keywords: ['baby proof', 'childproof', 'baby gate'], emoji: '🔒' },

  // ── Wedding planning ───────────────────────────────────
  { keywords: ['venue', 'wedding venue', 'reception'], emoji: '🏰' },
  { keywords: ['catering', 'caterer', 'menu tasting'], emoji: '🍽️' },
  { keywords: ['florist', 'flower arrangement', 'centerpiece'], emoji: '💐' },
  { keywords: ['wedding photographer', 'engagement photos'], emoji: '📸' },
  { keywords: ['invitation', 'invitations', 'rsvp', 'save the date'], emoji: '💌' },
  { keywords: ['rehearsal dinner'], emoji: '🍽️' },
  { keywords: ['bachelorette', 'bachelor party', 'hen party', 'stag do'], emoji: '🥳' },
  { keywords: ['bridal shower'], emoji: '🎉' },
  { keywords: ['registry', 'wedding registry', 'gift registry'], emoji: '🎁' },
  { keywords: ['seating chart', 'seating arrangement'], emoji: '📋' },
  { keywords: ['wedding dress', 'tuxedo', 'suit fitting'], emoji: '👗' },
  { keywords: ['vows', 'write vows'], emoji: '💒' },
  { keywords: ['honeymoon'], emoji: '🏝️' },

  // ── Household chores expanded ──────────────────────────
  { keywords: ['change sheets', 'change linens', 'fresh sheets'], emoji: '🛏️' },
  { keywords: ['fold laundry', 'fold clothes', 'put away clothes'], emoji: '🧺' },
  { keywords: ['defrost', 'thaw'], emoji: '❄️' },
  { keywords: ['sharpen knives', 'knife sharpening'], emoji: '🔪' },
  { keywords: ['replace filter', 'change filter', 'hvac', 'air filter'], emoji: '🌬️' },
  { keywords: ['dust', 'dusting'], emoji: '🧹' },
  { keywords: ['wipe', 'wipe down', 'sanitize', 'disinfect'], emoji: '🧽' },
  { keywords: ['clean windows', 'wash windows', 'window cleaning'], emoji: '🪟' },
  { keywords: ['polish', 'shine', 'buff'], emoji: '✨' },
  { keywords: ['stock fridge', 'restock', 'pantry'], emoji: '🛒' },
  { keywords: ['unclog', 'drain', 'plunge'], emoji: '🪠' },
  { keywords: ['light bulb', 'change bulb', 'replace bulb'], emoji: '💡' },
  { keywords: ['pest control', 'exterminator', 'bug spray', 'ant'], emoji: '🐜' },

  // ── Outdoor activities expanded ────────────────────────
  { keywords: ['paddleboard', 'paddle board', 'sup'], emoji: '🏄' },
  { keywords: ['zip line', 'zipline', 'ziplining'], emoji: '🏔️' },
  { keywords: ['paragliding', 'hang gliding', 'gliding'], emoji: '🪂' },
  { keywords: ['mountain biking', 'mtb'], emoji: '🚵' },
  { keywords: ['trail running'], emoji: '🏃' },
  { keywords: ['geocaching', 'orienteering'], emoji: '🗺️' },
  { keywords: ['horseback', 'horse riding', 'equestrian'], emoji: '🏇' },
  { keywords: ['rafting', 'white water', 'whitewater'], emoji: '🚣' },
  { keywords: ['bungee', 'bungee jump'], emoji: '🤸' },
  { keywords: ['skydiving', 'skydive', 'parachute'], emoji: '🪂' },
  { keywords: ['snorkeling trip', 'boat', 'boating', 'sailing', 'sail'], emoji: '⛵' },
  { keywords: ['jet ski', 'water ski', 'wakeboard'], emoji: '🚤' },

  // ── Weather & seasons ──────────────────────────────────
  { keywords: ['rain', 'rainy', 'umbrella', 'raincoat'], emoji: '🌧️' },
  { keywords: ['thunderstorm', 'lightning', 'storm'], emoji: '⛈️' },
  { keywords: ['heat wave', 'hot day', 'heatstroke'], emoji: '🥵' },
  { keywords: ['cold snap', 'freezing', 'frost'], emoji: '🥶' },
  { keywords: ['fog', 'foggy', 'misty'], emoji: '🌫️' },
  { keywords: ['windy', 'wind', 'gust'], emoji: '🌬️' },
  { keywords: ['rainbow'], emoji: '🌈' },
  { keywords: ['sunny', 'sunshine', 'clear sky'], emoji: '☀️' },

  // ── Home automation & smart home ───────────────────────
  { keywords: ['smart home', 'home automation'], emoji: '🏠' },
  { keywords: ['alexa', 'google home', 'siri', 'smart speaker'], emoji: '🔊' },
  { keywords: ['smart light', 'hue', 'smart bulb'], emoji: '💡' },
  { keywords: ['thermostat', 'nest', 'ecobee'], emoji: '🌡️' },
  { keywords: ['robot vacuum', 'roomba'], emoji: '🤖' },
  { keywords: ['smart lock', 'keypad'], emoji: '🔐' },
  { keywords: ['security camera', 'ring', 'wyze'], emoji: '📷' },

  // ── Education for kids ─────────────────────────────────
  { keywords: ['science fair', 'science project'], emoji: '🔬' },
  { keywords: ['field trip', 'school trip'], emoji: '🚌' },
  { keywords: ['show and tell'], emoji: '🎒' },
  { keywords: ['back to school', 'school supplies', 'school shopping'], emoji: '📚' },
  { keywords: ['report card', 'grades', 'parent portal'], emoji: '📝' },
  { keywords: ['spelling bee', 'math competition'], emoji: '🏆' },
  { keywords: ['art class', 'music class'], emoji: '🎨' },
  { keywords: ['swim lesson', 'swim class', 'piano lesson'], emoji: '🎓' },

  // ── Civic & community ──────────────────────────────────
  { keywords: ['protest', 'rally', 'march'], emoji: '✊' },
  { keywords: ['petition', 'sign petition'], emoji: '📜' },
  { keywords: ['town hall', 'community meeting', 'council meeting'], emoji: '🏛️' },
  { keywords: ['neighborhood watch', 'block party'], emoji: '🏘️' },
  { keywords: ['census', 'survey'], emoji: '📊' },

  // ── Subscription & streaming ───────────────────────────
  { keywords: ['spotify', 'apple music', 'playlist'], emoji: '🎵' },
  { keywords: ['hulu', 'disney plus', 'amazon prime', 'hbo'], emoji: '📺' },
  { keywords: ['audible', 'audiobook', 'audiobooks'], emoji: '🎧' },
  { keywords: ['kindle', 'ebook', 'e-book', 'ereader'], emoji: '📱' },
  { keywords: ['patreon', 'substack', 'membership'], emoji: '⭐' },

  // ── Time management & productivity ─────────────────────
  { keywords: ['pomodoro', 'time block', 'time blocking'], emoji: '🍅' },
  { keywords: ['prioritize', 'priority', 'urgent'], emoji: '🔴' },
  { keywords: ['delegate', 'delegating', 'assign'], emoji: '👉' },
  { keywords: ['automate', 'automation', 'zapier', 'shortcut'], emoji: '⚙️' },
  { keywords: ['batch', 'batching', 'batch tasks'], emoji: '📦' },
  { keywords: ['inbox zero', 'process inbox'], emoji: '📭' },
  { keywords: ['standup notes', 'daily log', 'work log'], emoji: '📋' },

  // ── Language & culture ─────────────────────────────────
  { keywords: ['spanish', 'spanish class', 'learn spanish'], emoji: '🇪🇸' },
  { keywords: ['french', 'french class', 'learn french'], emoji: '🇫🇷' },
  { keywords: ['japanese', 'learn japanese'], emoji: '🇯🇵' },
  { keywords: ['chinese class', 'mandarin', 'learn chinese'], emoji: '🇨🇳' },
  { keywords: ['german', 'learn german'], emoji: '🇩🇪' },
  { keywords: ['korean class', 'learn korean'], emoji: '🇰🇷' },
  { keywords: ['sign language', 'asl'], emoji: '🤟' },
  { keywords: ['translate', 'translation'], emoji: '🌐' },

  // ── Photography expanded ───────────────────────────────
  { keywords: ['portrait', 'headshot', 'photo shoot', 'photoshoot'], emoji: '📸' },
  { keywords: ['landscape photo', 'nature photo', 'golden hour'], emoji: '📷' },
  { keywords: ['edit photos', 'lightroom', 'photoshop', 'photo editing'], emoji: '🖼️' },
  { keywords: ['drone', 'aerial photo', 'drone footage'], emoji: '🛸' },
  { keywords: ['film camera', 'analog', '35mm', 'darkroom'], emoji: '📷' },
  { keywords: ['tripod', 'camera gear', 'lens'], emoji: '📸' },

  // ── Science & STEM ─────────────────────────────────────
  { keywords: ['experiment', 'hypothesis'], emoji: '🧪' },
  { keywords: ['data', 'data analysis', 'statistics', 'stats'], emoji: '📊' },
  { keywords: ['equation', 'math', 'calculus', 'algebra'], emoji: '🧮' },
  { keywords: ['physics'], emoji: '⚛️' },
  { keywords: ['biology', 'bio'], emoji: '🧬' },
  { keywords: ['chemistry', 'chem'], emoji: '🧪' },
  { keywords: ['engineering', 'engineer'], emoji: '⚙️' },
  { keywords: ['robotics', 'robot', 'arduino', 'raspberry pi'], emoji: '🤖' },
  { keywords: ['3d print', '3d printing', '3d printer'], emoji: '🖨️' },
  { keywords: ['soldering', 'solder', 'circuit board', 'pcb'], emoji: '🔌' },

  // ── Relationship & communication ───────────────────────
  { keywords: ['boundaries', 'set boundaries'], emoji: '🚧' },
  { keywords: ['couples therapy', 'marriage counseling'], emoji: '💑' },
  { keywords: ['forgive', 'forgiveness', 'make up', 'reconcile'], emoji: '🕊️' },
  { keywords: ['communicate', 'have a talk', 'difficult conversation'], emoji: '🗣️' },
  { keywords: ['love note', 'sweet note'], emoji: '💌' },
  { keywords: ['hug', 'cuddle'], emoji: '🤗' },

  // ── Nostalgia & fun ────────────────────────────────────
  { keywords: ['photo booth'], emoji: '📸' },
  { keywords: ['treasure hunt', 'scavenger hunt'], emoji: '🗺️' },
  { keywords: ['pillow fort', 'blanket fort'], emoji: '🏰' },
  { keywords: ['movie marathon', 'binge watch', 'binge'], emoji: '🎬' },
  { keywords: ['stargazing party', 'bonfire night'], emoji: '🌟' },
  { keywords: ['water balloon', 'water fight', 'water gun'], emoji: '💦' },
  { keywords: ['slip and slide', 'sprinkler'], emoji: '💦' },
  { keywords: ['costume party', 'fancy dress', 'cosplay'], emoji: '🎭' },
  { keywords: ['carnival', 'fair', 'funfair', 'county fair'], emoji: '🎡' },
  { keywords: ['haunted house', 'horror', 'scary movie'], emoji: '👻' },
  { keywords: ['sleepover', 'slumber party', 'pajama party'], emoji: '🛏️' },

  // ── Car & driving expanded ─────────────────────────────
  { keywords: ['driving lesson', 'driving test', 'road test'], emoji: '🚗' },
  { keywords: ['parallel park', 'parking practice'], emoji: '🅿️' },
  { keywords: ['car insurance', 'auto insurance'], emoji: '🛡️' },
  { keywords: ['renew tags', 'registration renewal', 'sticker'], emoji: '🪪' },
  { keywords: ['road rage', 'traffic', 'rush hour'], emoji: '🚦' },
  { keywords: ['ev', 'electric car', 'charging station', 'tesla'], emoji: '🔌' },
  { keywords: ['car detail', 'detailing', 'wax car'], emoji: '🚗' },
  { keywords: ['flat tire', 'spare tire', 'tow truck', 'aaa'], emoji: '🛞' },
  { keywords: ['carpool lane', 'hov'], emoji: '🚗' },

  // ── Sustainability & eco ───────────────────────────────
  { keywords: ['reusable', 'reusable bag', 'zero waste'], emoji: '♻️' },
  { keywords: ['thrift', 'thrift store', 'secondhand', 'consignment'], emoji: '🛍️' },
  { keywords: ['solar', 'solar panel', 'solar power'], emoji: '☀️' },
  { keywords: ['electric bill', 'water bill', 'energy bill'], emoji: '💡' },
  { keywords: ['carbon footprint', 'offset', 'sustainable'], emoji: '🌍' },
  { keywords: ['plant based', 'vegan', 'vegetarian', 'meatless'], emoji: '🥦' },
  { keywords: ['farmers market', 'local produce', 'farm stand'], emoji: '🧑‍🌾' },
  { keywords: ['rain barrel', 'rain garden', 'water conservation'], emoji: '🌧️' },

  // ── Misc catchall ──────────────────────────────────────
  { keywords: ['birthday card', 'greeting card', 'postcard'], emoji: '✉️' },
  { keywords: ['wrap gift', 'gift wrap', 'wrapping'], emoji: '🎁' },
  { keywords: ['balloon', 'balloons', 'confetti'], emoji: '🎈' },
  { keywords: ['candle', 'candles', 'incense'], emoji: '🕯️' },
  { keywords: ['blanket', 'throw', 'quilt'], emoji: '🛋️' },
  { keywords: ['sunglasses', 'hat', 'cap'], emoji: '🧢' },
  { keywords: ['backpack', 'bag', 'tote'], emoji: '🎒' },
  { keywords: ['watch', 'wristwatch', 'jewelry', 'bracelet', 'necklace'], emoji: '⌚' },
  { keywords: ['umbrella'], emoji: '☂️' },
  { keywords: ['flashlight', 'torch', 'lantern'], emoji: '🔦' },
  { keywords: ['map', 'directions', 'navigate', 'gps'], emoji: '🗺️' },
  { keywords: ['flag', 'pennant'], emoji: '🚩' },
  { keywords: ['trophy', 'award', 'medal', 'ribbon'], emoji: '🏆' },
  { keywords: ['crown', 'tiara'], emoji: '👑' },
  { keywords: ['dice', 'random', 'lucky'], emoji: '🎲' },
  { keywords: ['horoscope', 'zodiac', 'astrology'], emoji: '♈' },
  { keywords: ['tarot', 'oracle', 'divination'], emoji: '🔮' },
  { keywords: ['crystal', 'crystals', 'gemstone'], emoji: '💎' },
  { keywords: ['essential oil', 'aromatherapy', 'diffuser'], emoji: '🌸' },
  { keywords: ['bucket list'], emoji: '📝' },
  { keywords: ['random act', 'pay it forward', 'kindness'], emoji: '💛' },
  { keywords: ['adventure', 'explore'], emoji: '🧭' },
  { keywords: ['challenge', 'dare'], emoji: '🔥' },
  { keywords: ['promise', 'commitment', 'pledge'], emoji: '🤞' },
  { keywords: ['wish', 'wish list', 'wishlist'], emoji: '⭐' },
  { keywords: ['dream', 'dreams', 'lucid dream'], emoji: '💭' },
  { keywords: ['miracle morning', 'morning ritual'], emoji: '🌅' },
  { keywords: ['evening ritual', 'bedtime ritual'], emoji: '🌙' },
  { keywords: ['power nap', 'siesta'], emoji: '😴' },
  { keywords: ['brain dump', 'brain storm'], emoji: '🧠' },
  { keywords: ['deep breath', 'box breathing', '4-7-8'], emoji: '🌬️' },
  { keywords: ['cold shower'], emoji: '🚿' },
  { keywords: ['sun exposure', 'morning sun', 'sunlight'], emoji: '☀️' },
  { keywords: ['grounding', 'earthing', 'barefoot'], emoji: '🦶' },
  { keywords: ['eye contact', 'posture', 'body language'], emoji: '🧍' },
  { keywords: ['compliment', 'praise'], emoji: '💬' },
  { keywords: ['smile', 'smiling'], emoji: '😊' },
  { keywords: ['laugh', 'laughter', 'comedy'], emoji: '😂' },
  { keywords: ['surprise someone', 'random surprise'], emoji: '🎉' },
  { keywords: ['high five', 'fist bump', 'handshake'], emoji: '🤝' },
];

/**
 * Given a task title, returns a suggested emoji or undefined.
 * Matches against lowercased title, checking if any keyword is found as a
 * whole word (bounded by word boundaries or start/end of string).
 */
export function suggestEmoji(title: string): string | undefined {
  const lower = title.toLowerCase().trim();
  if (!lower) return undefined;

  for (const rule of EMOJI_RULES) {
    for (const kw of rule.keywords) {
      // Use word boundary matching so "walk" doesn't match inside "walkthrough"
      const pattern = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i');
      if (pattern.test(lower)) {
        return rule.emoji;
      }
    }
  }

  return undefined;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
