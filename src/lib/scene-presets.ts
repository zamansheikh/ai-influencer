export interface ScenePreset {
  label: string;
  prompt: string;
}

export interface SceneCategory {
  id: string;
  name: string;
  emoji: string;
  presets: ScenePreset[];
}

export const SCENE_CATEGORIES: SceneCategory[] = [
  {
    id: 'casual',
    name: 'Casual & Lifestyle',
    emoji: '☕',
    presets: [
      { label: 'Coffee shop selfie', prompt: 'Taking a casual selfie in a trendy coffee shop, holding a latte, natural smile, warm ambient lighting, cozy atmosphere' },
      { label: 'Morning routine', prompt: 'Morning skincare routine in a bright bathroom, fresh-faced, natural light from window, minimalist aesthetic' },
      { label: 'Cozy reading', prompt: 'Reading a book on a cozy couch with a blanket, soft warm lighting, bookshelf in background, relaxed and content expression' },
      { label: 'Street style', prompt: 'Walking down a city street, casual streetwear outfit, candid shot, urban background, golden hour light' },
      { label: 'Brunch vibes', prompt: 'At a beautiful brunch table, colorful food spread, aesthetically plated dishes, natural daylight, happy expression' },
      { label: 'Home office', prompt: 'Working at a clean minimal home desk, laptop and plants, natural light, focused but approachable expression' },
      { label: 'Sunset balcony', prompt: 'Standing on a balcony during sunset, warm golden light on face, city skyline in background, peaceful expression' },
      { label: 'Farmers market', prompt: 'Shopping at a colorful farmers market, holding fresh flowers, vibrant colors, natural outdoor light, genuine smile' },
    ],
  },
  {
    id: 'professional',
    name: 'Professional & Business',
    emoji: '💼',
    presets: [
      { label: 'Corporate headshot', prompt: 'Professional corporate headshot, modern office background, business attire, confident smile, studio lighting' },
      { label: 'Conference speaker', prompt: 'Speaking at a tech conference on stage, presentation screen behind, professional outfit, confident pose, stage lighting' },
      { label: 'Team meeting', prompt: 'Leading a team meeting in a modern glass conference room, business casual, engaged expression, natural office light' },
      { label: 'LinkedIn profile', prompt: 'Professional LinkedIn profile photo, neutral blurred background, business casual attire, approachable smile, soft studio lighting' },
      { label: 'Co-working space', prompt: 'Working in a trendy co-working space, laptop open, creative environment, plants and modern furniture, natural light' },
      { label: 'Podcast host', prompt: 'Hosting a podcast, professional microphone, headphones around neck, studio background, warm engaged expression' },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion & Beauty',
    emoji: '👗',
    presets: [
      { label: 'Editorial shoot', prompt: 'High-fashion editorial photoshoot, dramatic pose, designer clothing, professional studio lighting, fashion magazine quality' },
      { label: 'Runway look', prompt: 'Walking a fashion runway, high-end outfit, confident stride, dramatic runway lighting, blurred audience background' },
      { label: 'Beauty closeup', prompt: 'Close-up beauty shot, flawless makeup, glowing skin, soft ring light, clean minimal background, magazine cover quality' },
      { label: 'Streetwear', prompt: 'Urban streetwear photoshoot, trendy outfit, graffiti wall background, confident pose, natural street lighting' },
      { label: 'Jewelry showcase', prompt: 'Elegant portrait showcasing jewelry, soft glamour lighting, dark background, hands near face showing rings and bracelet' },
      { label: 'Hair transformation', prompt: 'Showing off a stunning hairstyle, salon-quality hair, soft backlight creating hair glow, clean background' },
      { label: 'Mirror selfie', prompt: 'Full-body mirror selfie in a stylish outfit, clean aesthetic room, good natural lighting, trendy pose' },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    emoji: '💪',
    presets: [
      { label: 'Gym workout', prompt: 'Working out at a modern gym, athletic wear, mid-exercise dynamic pose, dramatic gym lighting, motivated expression' },
      { label: 'Yoga pose', prompt: 'Practicing yoga on a mat, serene outdoor setting, sunrise light, balanced pose, peaceful and focused expression' },
      { label: 'Running outdoors', prompt: 'Running on a scenic trail, athletic outfit, dynamic mid-stride pose, morning golden light, determined expression' },
      { label: 'Post-workout', prompt: 'Post-workout selfie, glowing skin, athletic wear, gym or studio background, confident accomplished smile' },
      { label: 'Healthy meal prep', prompt: 'Preparing a healthy colorful meal in a modern kitchen, fresh ingredients, bright lighting, engaged in cooking' },
      { label: 'Smoothie bowl', prompt: 'Holding a beautiful smoothie bowl, bright colorful toppings, clean minimal setting, healthy lifestyle aesthetic' },
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Adventure',
    emoji: '✈️',
    presets: [
      { label: 'Beach paradise', prompt: 'Standing on a pristine tropical beach, turquoise water, white sand, sunset colors, relaxed vacation outfit, happy expression' },
      { label: 'Mountain summit', prompt: 'At a mountain summit with breathtaking view, hiking gear, wind in hair, dramatic landscape, triumphant expression' },
      { label: 'European street', prompt: 'Walking down a charming European cobblestone street, café terraces, historic architecture, stylish travel outfit, golden hour' },
      { label: 'Desert adventure', prompt: 'Standing in a vast desert landscape, flowing outfit, dramatic sand dunes, warm golden light, adventurous expression' },
      { label: 'City skyline', prompt: 'On a rooftop with a stunning city skyline view, evening blue hour, city lights starting to glow, elegant outfit' },
      { label: 'Tropical pool', prompt: 'Lounging by an infinity pool overlooking the ocean, resort setting, swimwear, tropical plants, bright sunny day' },
      { label: 'Cherry blossoms', prompt: 'Under beautiful cherry blossom trees in Japan, petals falling, soft pink light, elegant spring outfit, serene expression' },
      { label: 'Northern lights', prompt: 'Standing under the northern lights aurora borealis, warm winter clothing, snow landscape, magical green and purple sky' },
    ],
  },
  {
    id: 'nightlife',
    name: 'Night & Events',
    emoji: '🌙',
    presets: [
      { label: 'Rooftop bar', prompt: 'At a stylish rooftop bar at night, city skyline with lights, elegant cocktail outfit, ambient neon lighting, sophisticated pose' },
      { label: 'Red carpet', prompt: 'Walking a red carpet at a glamorous event, formal evening wear, camera flashes, confident pose, dramatic lighting' },
      { label: 'Concert crowd', prompt: 'At a live concert, colorful stage lights, energetic crowd behind, festival outfit, excited happy expression' },
      { label: 'Neon portrait', prompt: 'Close-up portrait with neon lights reflecting on face, urban night setting, pink and blue neon glow, moody atmosphere' },
      { label: 'Fine dining', prompt: 'At an upscale restaurant, candlelit ambiance, elegant outfit, wine glass on table, warm intimate lighting' },
      { label: 'Gallery opening', prompt: 'At an art gallery opening, modern art on walls, sophisticated outfit, holding champagne, artistic lighting' },
    ],
  },
  {
    id: 'creative',
    name: 'Creative & Artistic',
    emoji: '🎨',
    presets: [
      { label: 'Studio portrait', prompt: 'Professional studio portrait, single-color backdrop, dramatic directional lighting, striking pose, high-end photography quality' },
      { label: 'Vintage film', prompt: 'Retro vintage film photography style, warm tones, film grain, 70s fashion, nostalgic lighting, authentic film camera look' },
      { label: 'Cinematic shot', prompt: 'Cinematic wide-angle shot, movie-like composition, dramatic lighting, shallow depth of field, anamorphic lens flare' },
      { label: 'Black and white', prompt: 'Dramatic black and white portrait, high contrast, moody shadows, classic photography style, powerful expression' },
      { label: 'Double exposure', prompt: 'Artistic double exposure portrait, cityscape blended with face, creative composite, dreamy ethereal mood' },
      { label: 'Underwater', prompt: 'Underwater portrait, flowing hair and fabric, turquoise water, ethereal bubbles, magical mermaid-like aesthetic, dramatic lighting' },
      { label: 'Holographic', prompt: 'Futuristic portrait with holographic elements, iridescent lighting, cyber-aesthetic, chrome and glass reflections, sci-fi vibe' },
    ],
  },
  {
    id: 'seasonal',
    name: 'Seasonal & Holiday',
    emoji: '🎄',
    presets: [
      { label: 'Summer beach', prompt: 'Summer beach day, bright sunshine, colorful swimwear, sunglasses, ocean waves, carefree vacation energy' },
      { label: 'Autumn park', prompt: 'Walking through an autumn park, colorful falling leaves, cozy sweater and scarf, warm golden afternoon light' },
      { label: 'Winter snow', prompt: 'Playing in fresh snow, warm winter coat and beanie, snowflakes falling, rosy cheeks, joyful expression, soft winter light' },
      { label: 'Spring garden', prompt: 'In a blooming spring garden, surrounded by colorful flowers, light floral dress, soft natural light, fresh and happy' },
      { label: 'Christmas vibes', prompt: 'Cozy Christmas setting, decorated tree with lights, holding a gift, festive sweater, warm bokeh lights, holiday cheer' },
      { label: 'New Year party', prompt: 'New Year celebration, glamorous outfit, confetti and sparklers, midnight party atmosphere, joyful expression' },
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Gaming',
    emoji: '🎮',
    presets: [
      { label: 'Gaming setup', prompt: 'At a professional gaming setup, RGB lighting, multiple monitors, gaming headset, focused expression, dark room with neon' },
      { label: 'VR experience', prompt: 'Wearing a VR headset, futuristic setting, reaching out to virtual world, colorful light effects, amazed expression' },
      { label: 'Unboxing', prompt: 'Unboxing a new tech product, clean desk setup, excited expression, product packaging visible, bright even lighting' },
      { label: 'Coding session', prompt: 'Coding at a sleek desk, code on multiple screens, dark IDE theme, ambient desk lamp, focused developer vibe' },
      { label: 'Product review', prompt: 'Holding a tech gadget for review, clean background, product clearly visible, professional YouTube thumbnail style' },
    ],
  },
  {
    id: 'food',
    name: 'Food & Cooking',
    emoji: '🍕',
    presets: [
      { label: 'Chef cooking', prompt: 'Cooking in a beautiful kitchen, chef apron, fresh ingredients, steam rising from pan, warm kitchen lighting, passionate expression' },
      { label: 'Food presentation', prompt: 'Presenting a beautifully plated dish, restaurant-quality food, overhead angle, garnished perfectly, natural light' },
      { label: 'Wine tasting', prompt: 'Wine tasting in a vineyard, holding a glass of wine, golden sunset over grape vines, elegant casual outfit' },
      { label: 'Baking session', prompt: 'Baking in a cozy kitchen, flour-dusted apron, fresh pastries on counter, warm oven glow, joyful expression' },
      { label: 'Street food', prompt: 'Enjoying street food at an Asian night market, neon signs, steam from food stalls, vibrant atmosphere' },
    ],
  },
  {
    id: 'bangladesh',
    name: 'Bangladesh & South Asian',
    emoji: '🇧🇩',
    presets: [
      { label: 'Dhaka rooftop', prompt: 'Standing on a rooftop in Dhaka city, colorful buildings below, sunset sky over the cityscape, trendy fusion outfit mixing traditional and modern, warm golden light, confident urban influencer pose' },
      { label: 'Old Dhaka heritage', prompt: 'Walking through the historic streets of Old Dhaka, Ahsan Manzil pink palace in the background, wearing elegant traditional-modern fusion outfit, rickshaws and heritage architecture, golden afternoon light' },
      { label: 'Cox\'s Bazar beach', prompt: 'Walking along the world\'s longest natural sea beach at Cox\'s Bazar, golden sand stretching endlessly, turquoise waves, flowing beach outfit, windblown hair, sunset golden hour, cinematic wide shot' },
      { label: 'Sundarbans mangrove', prompt: 'Standing on a wooden boat in the Sundarbans mangrove forest, lush green canopy reflecting in calm water, adventure outfit, serene mysterious atmosphere, dappled sunlight through trees' },
      { label: 'Tea garden Sylhet', prompt: 'Standing among the rolling green tea gardens of Sylhet, endless rows of tea bushes, misty hills in background, wearing a light elegant outfit, soft morning light, fresh and dreamy atmosphere' },
      { label: 'Rickshaw art', prompt: 'Posing next to a colorfully painted Bangladeshi rickshaw, vibrant folk art details, busy Dhaka street, colorful outfit matching the rickshaw art, candid joyful expression' },
      { label: 'Pohela Boishakh', prompt: 'Celebrating Pohela Boishakh (Bengali New Year), wearing a beautiful red and white saree or panjabi, alpona (rangoli) patterns on the ground, festive marigold flowers, traditional ornaments, joyful celebration atmosphere' },
      { label: 'Boat on river', prompt: 'Sitting on a traditional wooden boat on a Bangladeshi river, calm emerald water reflecting the sky, rural green landscape, wearing a comfortable ethnic outfit, peaceful golden hour light, serene expression' },
      { label: 'Hatirjheel sunset', prompt: 'Walking along the Hatirjheel waterfront in Dhaka at sunset, modern bridge and city lights reflecting in water, stylish urban outfit, purple and orange sky, contemporary city vibe' },
      { label: 'Street food fuchka', prompt: 'Enjoying fuchka (panipuri) at a colorful Bangladeshi street food stall, vibrant street atmosphere, neon lights, casual trendy outfit, laughing and having fun, authentic local food experience' },
      { label: 'Saree elegance', prompt: 'Wearing a stunning Jamdani or Muslin saree, intricate traditional Bengali weave patterns, elegant jewelry, standing in a courtyard with terracotta architecture, soft natural light, graceful traditional pose' },
      { label: 'Lalbagh Fort', prompt: 'Posing at the historic Lalbagh Fort in Dhaka, Mughal-era red brick architecture, arched doorways, wearing elegant fusion outfit, dramatic shadows and warm afternoon light' },
      { label: 'Village life', prompt: 'In a beautiful Bangladeshi village, green rice paddies stretching to the horizon, traditional bamboo house, wearing comfortable ethnic clothing, peaceful rural atmosphere, warm natural light' },
      { label: 'Chittagong hills', prompt: 'Trekking in the Chittagong Hill Tracts, lush green hills and valleys, tribal-area landscape, adventure trekking outfit, misty mountain atmosphere, adventurous confident expression' },
      { label: 'Eid celebration', prompt: 'Eid celebration look, wearing a gorgeous embroidered salwar kameez or sherwani, festive home decoration, traditional sweets on table, warm family celebration atmosphere, elegant and joyful' },
      { label: 'Dhaka cafe culture', prompt: 'Sitting in a trendy Dhaka cafe, modern interior with exposed brick, specialty coffee, laptop and phone on table, stylish casual outfit, warm cafe lighting, content creator lifestyle' },
      { label: 'Sonargaon heritage', prompt: 'Exploring the ancient ruins of Sonargaon, moss-covered historic buildings, old Panam City architecture, wearing an artistic outfit, mysterious vintage atmosphere, soft diffused light' },
      { label: 'Night Dhaka skyline', prompt: 'On a high-rise balcony overlooking Dhaka city at night, millions of city lights, modern skyline with mosque minarets, elegant evening outfit, dramatic city light portrait' },
    ],
  },
];

// Flatten all presets for quick access
export const ALL_PRESETS: ScenePreset[] = SCENE_CATEGORIES.flatMap((c) => c.presets);
