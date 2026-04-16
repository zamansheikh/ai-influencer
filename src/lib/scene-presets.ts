export interface ScenePreset {
  label: string;
  scene: string;        // ONLY location, environment, lighting, atmosphere
  outfit?: string;      // clothing suggestion (used only if outfit control says so)
  pose?: string;        // pose/action suggestion
  expression?: string;  // facial expression suggestion
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
      { label: 'Coffee shop selfie', scene: 'Trendy coffee shop, warm ambient lighting, cozy atmosphere', pose: 'Taking a selfie, holding a latte', expression: 'Natural smile' },
      { label: 'Morning routine', scene: 'Bright bathroom, natural light from window, minimalist aesthetic', pose: 'Skincare routine, looking in mirror', expression: 'Fresh-faced, relaxed' },
      { label: 'Cozy reading', scene: 'Cozy couch with blanket, soft warm lighting, bookshelf in background', pose: 'Reading a book, relaxed seated', expression: 'Content, peaceful' },
      { label: 'Street style', scene: 'City street, urban background, golden hour light', outfit: 'Casual streetwear', pose: 'Walking, candid shot', expression: 'Confident' },
      { label: 'Brunch vibes', scene: 'Beautiful brunch table, colorful food spread, natural daylight', pose: 'Seated at table', expression: 'Happy, joyful' },
      { label: 'Home office', scene: 'Clean minimal desk, laptop and plants, natural light', pose: 'Working at desk', expression: 'Focused but approachable' },
      { label: 'Sunset balcony', scene: 'Balcony during sunset, warm golden light, city skyline in background', pose: 'Standing, leaning on railing', expression: 'Peaceful' },
      { label: 'Farmers market', scene: 'Colorful farmers market, vibrant colors, natural outdoor light', pose: 'Holding fresh flowers, shopping', expression: 'Genuine smile' },
    ],
  },
  {
    id: 'professional',
    name: 'Professional & Business',
    emoji: '💼',
    presets: [
      { label: 'Corporate headshot', scene: 'Modern office background, studio lighting', outfit: 'Business attire', expression: 'Confident smile' },
      { label: 'Conference speaker', scene: 'Tech conference stage, presentation screen behind, stage lighting', outfit: 'Professional outfit', pose: 'Speaking on stage, confident', expression: 'Confident, engaging' },
      { label: 'Team meeting', scene: 'Modern glass conference room, natural office light', outfit: 'Business casual', pose: 'Leading a meeting', expression: 'Engaged' },
      { label: 'LinkedIn profile', scene: 'Neutral blurred background, soft studio lighting', outfit: 'Business casual', expression: 'Approachable smile' },
      { label: 'Co-working space', scene: 'Trendy co-working space, plants and modern furniture, natural light', pose: 'Working at laptop', expression: 'Focused' },
      { label: 'Podcast host', scene: 'Podcast studio, professional microphone, studio background', pose: 'Hosting, speaking into mic', expression: 'Warm, engaged' },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion & Beauty',
    emoji: '👗',
    presets: [
      { label: 'Editorial shoot', scene: 'Professional studio, fashion magazine quality lighting', outfit: 'Designer clothing', pose: 'Dramatic fashion pose', expression: 'Intense, editorial' },
      { label: 'Runway look', scene: 'Fashion runway, dramatic runway lighting, blurred audience', outfit: 'High-end outfit', pose: 'Walking confidently', expression: 'Fierce, confident' },
      { label: 'Beauty closeup', scene: 'Soft ring light, clean minimal background, magazine cover quality', pose: 'Close-up portrait', expression: 'Glowing, serene' },
      { label: 'Streetwear', scene: 'Urban setting, graffiti wall background, natural street lighting', outfit: 'Trendy streetwear', pose: 'Confident casual pose', expression: 'Cool, relaxed' },
      { label: 'Mirror selfie', scene: 'Clean aesthetic room, good natural lighting', outfit: 'Stylish outfit', pose: 'Full-body mirror selfie', expression: 'Confident' },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    emoji: '💪',
    presets: [
      { label: 'Gym workout', scene: 'Modern gym, dramatic gym lighting', outfit: 'Athletic wear', pose: 'Mid-exercise dynamic pose', expression: 'Motivated, determined' },
      { label: 'Yoga pose', scene: 'Serene outdoor setting, sunrise light, yoga mat', outfit: 'Yoga attire', pose: 'Balanced yoga pose', expression: 'Peaceful, focused' },
      { label: 'Running outdoors', scene: 'Scenic trail, morning golden light', outfit: 'Athletic running outfit', pose: 'Dynamic mid-stride', expression: 'Determined' },
      { label: 'Post-workout', scene: 'Gym or studio background', outfit: 'Athletic wear', pose: 'Post-workout selfie', expression: 'Confident, accomplished smile' },
      { label: 'Healthy meal prep', scene: 'Modern kitchen, fresh ingredients, bright lighting', pose: 'Preparing food, cooking', expression: 'Engaged, happy' },
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Adventure',
    emoji: '✈️',
    presets: [
      { label: 'Beach paradise', scene: 'Pristine tropical beach, turquoise water, white sand, sunset colors', pose: 'Standing on beach', expression: 'Happy, relaxed' },
      { label: 'Mountain summit', scene: 'Mountain summit, breathtaking panoramic view, dramatic landscape', outfit: 'Hiking gear', pose: 'Standing at summit, arms open', expression: 'Triumphant' },
      { label: 'European street', scene: 'Charming European cobblestone street, café terraces, historic architecture, golden hour', pose: 'Walking, candid', expression: 'Happy, curious' },
      { label: 'City skyline', scene: 'Rooftop with stunning city skyline, evening blue hour, city lights glowing', pose: 'Standing, looking at view', expression: 'Contemplative' },
      { label: 'Tropical pool', scene: 'Infinity pool overlooking the ocean, resort setting, tropical plants, bright sunny day', pose: 'Lounging by pool', expression: 'Relaxed, happy' },
      { label: 'Cherry blossoms', scene: 'Under cherry blossom trees in Japan, petals falling, soft pink light', pose: 'Standing among blossoms', expression: 'Serene, gentle smile' },
      { label: 'Northern lights', scene: 'Under northern lights aurora borealis, snow landscape, magical green and purple sky', outfit: 'Warm winter clothing', pose: 'Standing, looking up at sky', expression: 'Amazed, wonder' },
    ],
  },
  {
    id: 'nightlife',
    name: 'Night & Events',
    emoji: '🌙',
    presets: [
      { label: 'Rooftop bar', scene: 'Stylish rooftop bar at night, city skyline with lights, ambient neon lighting', outfit: 'Elegant cocktail outfit', pose: 'Standing at bar, sophisticated', expression: 'Confident, sophisticated' },
      { label: 'Red carpet', scene: 'Red carpet event, camera flashes, dramatic lighting', outfit: 'Formal evening wear', pose: 'Walking red carpet', expression: 'Confident, poised' },
      { label: 'Concert crowd', scene: 'Live concert, colorful stage lights, energetic crowd behind', pose: 'Dancing, hands up', expression: 'Excited, happy' },
      { label: 'Neon portrait', scene: 'Urban night setting, pink and blue neon glow, moody atmosphere', pose: 'Close-up portrait', expression: 'Moody, intense' },
      { label: 'Fine dining', scene: 'Upscale restaurant, candlelit ambiance, wine glass on table, warm intimate lighting', outfit: 'Elegant outfit', pose: 'Seated at table', expression: 'Relaxed, sophisticated' },
    ],
  },
  {
    id: 'creative',
    name: 'Creative & Artistic',
    emoji: '🎨',
    presets: [
      { label: 'Studio portrait', scene: 'Professional studio, single-color backdrop, dramatic directional lighting', pose: 'Striking pose', expression: 'Intense, powerful' },
      { label: 'Vintage film', scene: 'Retro vintage setting, warm tones, film grain, nostalgic lighting', outfit: '70s fashion', expression: 'Nostalgic, dreamy' },
      { label: 'Cinematic shot', scene: 'Cinematic wide-angle, movie-like composition, dramatic lighting, shallow depth of field, anamorphic lens flare', expression: 'Dramatic' },
      { label: 'Black and white', scene: 'High contrast black and white, moody shadows, classic photography style', expression: 'Powerful, intense' },
      { label: 'Holographic', scene: 'Futuristic setting, holographic elements, iridescent lighting, chrome and glass reflections, sci-fi vibe', expression: 'Futuristic, cool' },
    ],
  },
  {
    id: 'seasonal',
    name: 'Seasonal & Holiday',
    emoji: '🎄',
    presets: [
      { label: 'Summer beach', scene: 'Beach, bright sunshine, ocean waves, carefree vacation energy', outfit: 'Colorful swimwear, sunglasses', expression: 'Happy, carefree' },
      { label: 'Autumn park', scene: 'Autumn park, colorful falling leaves, warm golden afternoon light', outfit: 'Cozy sweater and scarf', expression: 'Content, warm' },
      { label: 'Winter snow', scene: 'Fresh snow landscape, snowflakes falling, soft winter light', outfit: 'Warm winter coat and beanie', expression: 'Joyful, rosy cheeks' },
      { label: 'Spring garden', scene: 'Blooming spring garden, surrounded by colorful flowers, soft natural light', outfit: 'Light floral dress', expression: 'Fresh, happy' },
      { label: 'Christmas vibes', scene: 'Cozy Christmas setting, decorated tree with lights, warm bokeh lights', outfit: 'Festive sweater', pose: 'Holding a gift', expression: 'Holiday cheer, warm smile' },
      { label: 'New Year party', scene: 'New Year celebration, confetti and sparklers, midnight party atmosphere', outfit: 'Glamorous outfit', expression: 'Joyful, celebratory' },
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Gaming',
    emoji: '🎮',
    presets: [
      { label: 'Gaming setup', scene: 'Professional gaming setup, RGB lighting, multiple monitors, dark room with neon', pose: 'Seated at gaming desk, gaming headset', expression: 'Focused, intense' },
      { label: 'VR experience', scene: 'Futuristic setting, colorful light effects', pose: 'Wearing VR headset, reaching out', expression: 'Amazed, excited' },
      { label: 'Unboxing', scene: 'Clean desk setup, bright even lighting', pose: 'Unboxing a product, excited', expression: 'Excited, surprised' },
      { label: 'Coding session', scene: 'Sleek desk, code on multiple screens, dark IDE theme, ambient desk lamp', pose: 'Coding, focused', expression: 'Focused, developer vibe' },
    ],
  },
  {
    id: 'food',
    name: 'Food & Cooking',
    emoji: '🍕',
    presets: [
      { label: 'Chef cooking', scene: 'Beautiful kitchen, fresh ingredients, steam rising, warm kitchen lighting', outfit: 'Chef apron', pose: 'Cooking at stove', expression: 'Passionate, engaged' },
      { label: 'Food presentation', scene: 'Restaurant-quality food plating, overhead angle, natural light', pose: 'Presenting a dish', expression: 'Proud, elegant' },
      { label: 'Baking session', scene: 'Cozy kitchen, fresh pastries on counter, warm oven glow', outfit: 'Flour-dusted apron', pose: 'Baking', expression: 'Joyful' },
      { label: 'Street food', scene: 'Asian night market, neon signs, steam from food stalls, vibrant atmosphere', pose: 'Enjoying street food', expression: 'Happy, laughing' },
    ],
  },
  {
    id: 'bangladesh',
    name: 'Bangladesh & South Asian',
    emoji: '🇧🇩',
    presets: [
      { label: 'Dhaka rooftop', scene: 'Rooftop in Dhaka city, colorful buildings below, sunset sky over cityscape, warm golden light', pose: 'Standing, confident urban influencer pose', expression: 'Confident' },
      { label: 'Old Dhaka heritage', scene: 'Historic streets of Old Dhaka, Ahsan Manzil pink palace in background, rickshaws and heritage architecture, golden afternoon light', pose: 'Walking through streets', expression: 'Curious, happy' },
      { label: 'Cox\'s Bazar beach', scene: 'World\'s longest natural sea beach at Cox\'s Bazar, golden sand stretching endlessly, turquoise waves, sunset golden hour, cinematic wide shot', pose: 'Walking along shore, windblown hair', expression: 'Free, happy' },
      { label: 'Sundarbans mangrove', scene: 'Wooden boat in Sundarbans mangrove forest, lush green canopy reflecting in calm water, serene mysterious atmosphere, dappled sunlight', pose: 'Standing on boat', expression: 'Serene, adventurous' },
      { label: 'Tea garden Sylhet', scene: 'Rolling green tea gardens of Sylhet, endless rows of tea bushes, misty hills in background, soft morning light, dreamy atmosphere', pose: 'Standing among tea bushes', expression: 'Peaceful, dreamy' },
      { label: 'Rickshaw art', scene: 'Colorfully painted Bangladeshi rickshaw, vibrant folk art details, busy Dhaka street', pose: 'Posing next to rickshaw', expression: 'Candid, joyful' },
      { label: 'Pohela Boishakh', scene: 'Pohela Boishakh (Bengali New Year) celebration, alpona (rangoli) patterns on the ground, festive marigold flowers, joyful celebration atmosphere', outfit: 'Red and white saree or panjabi, traditional ornaments', expression: 'Joyful, celebratory' },
      { label: 'Boat on river', scene: 'Traditional wooden boat on a Bangladeshi river, calm emerald water reflecting sky, rural green landscape, peaceful golden hour light', pose: 'Sitting on boat', expression: 'Serene, peaceful' },
      { label: 'Hatirjheel sunset', scene: 'Hatirjheel waterfront in Dhaka at sunset, modern bridge and city lights reflecting in water, purple and orange sky, contemporary city vibe', pose: 'Walking along waterfront', expression: 'Content' },
      { label: 'Street food fuchka', scene: 'Colorful Bangladeshi street food stall, vibrant street atmosphere, neon lights, authentic local food experience', pose: 'Enjoying fuchka (panipuri)', expression: 'Laughing, having fun' },
      { label: 'Saree elegance', scene: 'Courtyard with terracotta architecture, soft natural light', outfit: 'Stunning Jamdani or Muslin saree, intricate traditional Bengali weave, elegant jewelry', pose: 'Graceful traditional pose', expression: 'Graceful, elegant' },
      { label: 'Lalbagh Fort', scene: 'Historic Lalbagh Fort in Dhaka, Mughal-era red brick architecture, arched doorways, dramatic shadows, warm afternoon light', pose: 'Posing at fort entrance', expression: 'Confident' },
      { label: 'Village life', scene: 'Beautiful Bangladeshi village, green rice paddies stretching to horizon, traditional bamboo house, peaceful rural atmosphere, warm natural light', pose: 'Standing in paddy field', expression: 'Peaceful, content' },
      { label: 'Chittagong hills', scene: 'Chittagong Hill Tracts, lush green hills and valleys, tribal-area landscape, misty mountain atmosphere', outfit: 'Adventure trekking outfit', pose: 'Trekking', expression: 'Adventurous, confident' },
      { label: 'Eid celebration', scene: 'Eid celebration, festive home decoration, traditional sweets on table, warm family celebration atmosphere', outfit: 'Gorgeous embroidered salwar kameez or sherwani', expression: 'Elegant, joyful' },
      { label: 'Dhaka cafe culture', scene: 'Trendy Dhaka cafe, modern interior with exposed brick, specialty coffee, warm cafe lighting', pose: 'Sitting at cafe, laptop and phone on table', expression: 'Content, creative' },
      { label: 'Sonargaon heritage', scene: 'Ancient ruins of Sonargaon, moss-covered historic buildings, old Panam City architecture, mysterious vintage atmosphere, soft diffused light', pose: 'Exploring ruins', expression: 'Curious, contemplative' },
      { label: 'Night Dhaka skyline', scene: 'High-rise balcony overlooking Dhaka city at night, millions of city lights, modern skyline with mosque minarets', outfit: 'Elegant evening outfit', pose: 'Standing at balcony', expression: 'Contemplative, sophisticated' },
    ],
  },
];

export const ALL_PRESETS: ScenePreset[] = SCENE_CATEGORIES.flatMap((c) => c.presets);
