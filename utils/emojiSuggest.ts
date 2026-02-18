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
