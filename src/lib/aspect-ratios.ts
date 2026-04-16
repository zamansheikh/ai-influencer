export interface AspectRatio {
  id: string;
  label: string;
  ratio: string;       // e.g. "1:1", "9:16"
  width: number;       // pixel width
  height: number;      // pixel height
  platform: string;
  description: string;
}

export interface RatioCategory {
  name: string;
  ratios: AspectRatio[];
}

export const RATIO_CATEGORIES: RatioCategory[] = [
  {
    name: 'Instagram',
    ratios: [
      { id: 'ig-square', label: 'Post (Square)', ratio: '1:1', width: 1080, height: 1080, platform: 'Instagram', description: 'Standard feed post' },
      { id: 'ig-portrait', label: 'Post (Portrait)', ratio: '4:5', width: 1080, height: 1350, platform: 'Instagram', description: 'Tall feed post — max vertical space' },
      { id: 'ig-story', label: 'Story / Reel', ratio: '9:16', width: 1080, height: 1920, platform: 'Instagram', description: 'Full-screen vertical story or reel' },
      { id: 'ig-landscape', label: 'Landscape', ratio: '1.91:1', width: 1080, height: 566, platform: 'Instagram', description: 'Wide feed post' },
    ],
  },
  {
    name: 'Facebook',
    ratios: [
      { id: 'fb-post', label: 'Feed Post', ratio: '1.91:1', width: 1200, height: 628, platform: 'Facebook', description: 'Standard link/image post' },
      { id: 'fb-square', label: 'Square Post', ratio: '1:1', width: 1080, height: 1080, platform: 'Facebook', description: 'Square feed post' },
      { id: 'fb-profile', label: 'Profile Photo', ratio: '1:1', width: 320, height: 320, platform: 'Facebook', description: 'Profile picture (displays as circle)' },
      { id: 'fb-cover', label: 'Cover Photo', ratio: '2.63:1', width: 820, height: 312, platform: 'Facebook', description: 'Page/profile cover banner' },
      { id: 'fb-story', label: 'Story', ratio: '9:16', width: 1080, height: 1920, platform: 'Facebook', description: 'Full-screen vertical story' },
    ],
  },
  {
    name: 'TikTok',
    ratios: [
      { id: 'tt-video', label: 'Video', ratio: '9:16', width: 1080, height: 1920, platform: 'TikTok', description: 'Standard TikTok video' },
      { id: 'tt-thumb', label: 'Thumbnail', ratio: '9:16', width: 1080, height: 1920, platform: 'TikTok', description: 'Video thumbnail/cover' },
    ],
  },
  {
    name: 'YouTube',
    ratios: [
      { id: 'yt-thumb', label: 'Thumbnail', ratio: '16:9', width: 1280, height: 720, platform: 'YouTube', description: 'Video thumbnail' },
      { id: 'yt-banner', label: 'Channel Banner', ratio: '16:9', width: 2560, height: 1440, platform: 'YouTube', description: 'Channel art banner' },
      { id: 'yt-short', label: 'Shorts', ratio: '9:16', width: 1080, height: 1920, platform: 'YouTube', description: 'YouTube Shorts vertical' },
    ],
  },
  {
    name: 'Twitter / X',
    ratios: [
      { id: 'tw-post', label: 'Image Post', ratio: '16:9', width: 1200, height: 675, platform: 'Twitter', description: 'Standard image tweet' },
      { id: 'tw-profile', label: 'Profile Photo', ratio: '1:1', width: 400, height: 400, platform: 'Twitter', description: 'Profile picture' },
      { id: 'tw-header', label: 'Header Banner', ratio: '3:1', width: 1500, height: 500, platform: 'Twitter', description: 'Profile header image' },
    ],
  },
  {
    name: 'LinkedIn',
    ratios: [
      { id: 'li-post', label: 'Post Image', ratio: '1.91:1', width: 1200, height: 628, platform: 'LinkedIn', description: 'Feed post or article cover' },
      { id: 'li-profile', label: 'Profile Photo', ratio: '1:1', width: 400, height: 400, platform: 'LinkedIn', description: 'Professional headshot' },
      { id: 'li-banner', label: 'Banner', ratio: '4:1', width: 1584, height: 396, platform: 'LinkedIn', description: 'Profile background image' },
    ],
  },
  {
    name: 'Pinterest',
    ratios: [
      { id: 'pin-standard', label: 'Standard Pin', ratio: '2:3', width: 1000, height: 1500, platform: 'Pinterest', description: 'Optimal pin size' },
      { id: 'pin-long', label: 'Long Pin', ratio: '1:2.1', width: 1000, height: 2100, platform: 'Pinterest', description: 'Extended tall pin' },
      { id: 'pin-square', label: 'Square Pin', ratio: '1:1', width: 1000, height: 1000, platform: 'Pinterest', description: 'Square format pin' },
    ],
  },
  {
    name: 'General',
    ratios: [
      { id: 'gen-square', label: 'Square', ratio: '1:1', width: 1024, height: 1024, platform: 'General', description: 'Universal square' },
      { id: 'gen-portrait', label: 'Portrait', ratio: '3:4', width: 768, height: 1024, platform: 'General', description: 'Vertical portrait' },
      { id: 'gen-landscape', label: 'Landscape', ratio: '16:9', width: 1920, height: 1080, platform: 'General', description: 'Widescreen landscape' },
      { id: 'gen-wide', label: 'Ultra Wide', ratio: '21:9', width: 2560, height: 1080, platform: 'General', description: 'Cinematic ultra-wide' },
      { id: 'gen-phone', label: 'Phone Wallpaper', ratio: '9:19.5', width: 1170, height: 2532, platform: 'General', description: 'Modern phone screen' },
    ],
  },
];

export const ALL_RATIOS: AspectRatio[] = RATIO_CATEGORIES.flatMap((c) => c.ratios);
