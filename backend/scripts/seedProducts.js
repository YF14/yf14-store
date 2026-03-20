require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const COLORS = {
  black:    '#0a0a0a',
  white:    '#ffffff',
  red:      '#c0392b',
  navy:     '#1a2a5e',
  emerald:  '#065f46',
  burgundy: '#6d2b3d',
  blush:    '#f4a7b9',
  gold:     '#c9a96e',
  midnight: '#1a1a2e',
  rose:     '#e91e8c',
  purple:   '#7b2d8b',
  ivory:    '#fffff0',
  dustyrose:'#dcb4b4',
  cobalt:   '#0047ab',
};

const categories = [
  { name: 'Evening Dresses',  slug: 'evening-dresses',  description: 'Elegant dresses for formal events and galas' },
  { name: 'Cocktail Dresses', slug: 'cocktail-dresses', description: 'Perfect for semi-formal events and parties' },
  { name: 'Maxi Dresses',     slug: 'maxi-dresses',     description: 'Floor-length dresses for any occasion' },
  { name: 'Mini Dresses',     slug: 'mini-dresses',     description: 'Short and chic dresses' },
  { name: 'Casual Dresses',   slug: 'casual-dresses',   description: 'Effortlessly stylish everyday dresses' },
  { name: 'Summer Dresses',   slug: 'summer-dresses',   description: 'Light and breezy dresses for warm weather' },
];

// Free high-quality dress images from Unsplash
const products = [
  // ── EVENING ──────────────────────────────────────────────
  {
    name: 'Velvet Midnight Gown',
    slug: 'velvet-midnight-gown',
    category: 'evening-dresses',
    price: 189,
    comparePrice: 240,
    shortDescription: 'Deep midnight velvet gown with a sweetheart neckline and side slit.',
    description: 'A showstopping floor-length gown crafted from premium stretch velvet. Features a sweetheart neckline, boning bodice, and an elegant side slit for ease of movement. Perfect for galas, weddings, and black-tie events.',
    material: '92% Polyester, 8% Elastane Velvet',
    careInstructions: 'Dry clean only. Do not bleach.',
    tags: ['gown', 'velvet', 'evening', 'formal', 'black-tie'],
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1566479179817-0b2d6ff88b2f?w=800&q=85', alt: 'Velvet Midnight Gown front', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=800&q=85', alt: 'Velvet Midnight Gown back' },
    ],
    variants: [
      { size: 'XS', color: 'Midnight Black', colorCode: COLORS.midnight, stock: 5 },
      { size: 'S',  color: 'Midnight Black', colorCode: COLORS.midnight, stock: 8 },
      { size: 'M',  color: 'Midnight Black', colorCode: COLORS.midnight, stock: 10 },
      { size: 'L',  color: 'Midnight Black', colorCode: COLORS.midnight, stock: 7 },
      { size: 'XL', color: 'Midnight Black', colorCode: COLORS.midnight, stock: 4 },
      { size: 'S',  color: 'Deep Burgundy',  colorCode: COLORS.burgundy, stock: 6 },
      { size: 'M',  color: 'Deep Burgundy',  colorCode: COLORS.burgundy, stock: 8 },
      { size: 'L',  color: 'Deep Burgundy',  colorCode: COLORS.burgundy, stock: 5 },
    ],
  },
  {
    name: 'Crystal Embellished Evening Dress',
    slug: 'crystal-embellished-evening-dress',
    category: 'evening-dresses',
    price: 245,
    comparePrice: 320,
    shortDescription: 'Sparkling crystal-encrusted bodice with a flowing chiffon skirt.',
    description: 'Make an unforgettable entrance in this stunning crystal-embellished evening dress. The fitted bodice is adorned with hundreds of hand-placed crystals, flowing into a dramatic chiffon skirt. Perfect for weddings, galas, and formal celebrations.',
    material: 'Bodice: 100% Silk Chiffon with crystal embellishments. Skirt: 100% Polyester Chiffon',
    careInstructions: 'Professional dry clean only.',
    tags: ['crystal', 'embellished', 'formal', 'gala', 'wedding-guest'],
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=85', alt: 'Crystal Evening Dress', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=85', alt: 'Crystal Evening Dress detail' },
    ],
    variants: [
      { size: 'XS', color: 'Champagne Gold', colorCode: COLORS.gold,  stock: 3 },
      { size: 'S',  color: 'Champagne Gold', colorCode: COLORS.gold,  stock: 5 },
      { size: 'M',  color: 'Champagne Gold', colorCode: COLORS.gold,  stock: 6 },
      { size: 'L',  color: 'Champagne Gold', colorCode: COLORS.gold,  stock: 4 },
      { size: 'S',  color: 'Classic Black',  colorCode: COLORS.black, stock: 7 },
      { size: 'M',  color: 'Classic Black',  colorCode: COLORS.black, stock: 8 },
      { size: 'L',  color: 'Classic Black',  colorCode: COLORS.black, stock: 5 },
    ],
  },
  {
    name: 'Silk Off-Shoulder Gown',
    slug: 'silk-off-shoulder-gown',
    category: 'evening-dresses',
    price: 210,
    shortDescription: 'Luxurious silk off-shoulder gown with an elegant draped silhouette.',
    description: 'Crafted from pure silk satin, this off-shoulder gown drapes beautifully over the body. The minimalist design speaks volumes — a clean silhouette with a subtle train. For the woman who knows less is more.',
    material: '100% Silk Satin',
    careInstructions: 'Dry clean only. Store hanging.',
    tags: ['silk', 'off-shoulder', 'minimalist', 'formal', 'satin'],
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=85', alt: 'Silk Off-Shoulder Gown', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Ivory White',  colorCode: COLORS.ivory,  stock: 4 },
      { size: 'S',  color: 'Ivory White',  colorCode: COLORS.ivory,  stock: 6 },
      { size: 'M',  color: 'Ivory White',  colorCode: COLORS.ivory,  stock: 7 },
      { size: 'L',  color: 'Ivory White',  colorCode: COLORS.ivory,  stock: 5 },
      { size: 'S',  color: 'Blush Rose',   colorCode: COLORS.blush,  stock: 5 },
      { size: 'M',  color: 'Blush Rose',   colorCode: COLORS.blush,  stock: 6 },
      { size: 'L',  color: 'Blush Rose',   colorCode: COLORS.blush,  stock: 4 },
    ],
  },

  // ── COCKTAIL ─────────────────────────────────────────────
  {
    name: 'Sequin Mini Cocktail Dress',
    slug: 'sequin-mini-cocktail-dress',
    category: 'cocktail-dresses',
    price: 135,
    comparePrice: 165,
    shortDescription: 'All-over sequin mini dress that catches every light in the room.',
    description: 'Turn heads in this dazzling all-over sequin cocktail dress. The body-con silhouette and above-the-knee length create a bold, confident look. From New Year\'s Eve parties to VIP events, this dress is made for moments.',
    material: '85% Nylon, 15% Elastane with sequin overlay',
    careInstructions: 'Hand wash cold. Do not wring. Air dry flat.',
    tags: ['sequin', 'mini', 'party', 'cocktail', 'NYE'],
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=85', alt: 'Sequin Cocktail Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Rose Gold',    colorCode: COLORS.rose,  stock: 6 },
      { size: 'S',  color: 'Rose Gold',    colorCode: COLORS.rose,  stock: 10 },
      { size: 'M',  color: 'Rose Gold',    colorCode: COLORS.rose,  stock: 12 },
      { size: 'L',  color: 'Rose Gold',    colorCode: COLORS.rose,  stock: 8 },
      { size: 'S',  color: 'Silver',       colorCode: '#c0c0c0',    stock: 8 },
      { size: 'M',  color: 'Silver',       colorCode: '#c0c0c0',    stock: 9 },
      { size: 'L',  color: 'Silver',       colorCode: '#c0c0c0',    stock: 6 },
      { size: 'S',  color: 'Midnight Black',colorCode: COLORS.black, stock: 7 },
      { size: 'M',  color: 'Midnight Black',colorCode: COLORS.black, stock: 8 },
    ],
  },
  {
    name: 'Wrap Midi Cocktail Dress',
    slug: 'wrap-midi-cocktail-dress',
    category: 'cocktail-dresses',
    price: 98,
    shortDescription: 'Flattering wrap midi dress in luxurious crepe fabric.',
    description: 'The wrap silhouette is universally flattering, and this midi cocktail dress elevates the concept with luxurious crepe fabric and a deep V-neckline. Ideal for work events, cocktail parties, and dinner dates.',
    material: '97% Polyester Crepe, 3% Elastane',
    careInstructions: 'Machine wash cold on gentle cycle. Hang dry.',
    tags: ['wrap', 'midi', 'cocktail', 'crepe', 'workwear'],
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=85', alt: 'Wrap Midi Cocktail Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Emerald Green', colorCode: COLORS.emerald, stock: 5 },
      { size: 'S',  color: 'Emerald Green', colorCode: COLORS.emerald, stock: 8 },
      { size: 'M',  color: 'Emerald Green', colorCode: COLORS.emerald, stock: 10 },
      { size: 'L',  color: 'Emerald Green', colorCode: COLORS.emerald, stock: 7 },
      { size: 'XL', color: 'Emerald Green', colorCode: COLORS.emerald, stock: 4 },
      { size: 'S',  color: 'Navy Blue',     colorCode: COLORS.navy,    stock: 7 },
      { size: 'M',  color: 'Navy Blue',     colorCode: COLORS.navy,    stock: 9 },
      { size: 'L',  color: 'Navy Blue',     colorCode: COLORS.navy,    stock: 6 },
    ],
  },

  // ── MAXI ─────────────────────────────────────────────────
  {
    name: 'Floral Chiffon Maxi Dress',
    slug: 'floral-chiffon-maxi-dress',
    category: 'maxi-dresses',
    price: 115,
    comparePrice: 145,
    shortDescription: 'Dreamy floral chiffon maxi with adjustable tie straps.',
    description: 'Float through any occasion in this ethereal floral chiffon maxi dress. The lightweight layers create beautiful movement, while the adjustable tie straps allow for a customized fit. Perfect for weddings, beach vacations, and garden parties.',
    material: '100% Polyester Chiffon',
    careInstructions: 'Machine wash cold. Tumble dry low.',
    tags: ['floral', 'chiffon', 'maxi', 'boho', 'wedding-guest', 'beach'],
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&q=85', alt: 'Floral Chiffon Maxi Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Dusty Rose',   colorCode: COLORS.dustyrose, stock: 6 },
      { size: 'S',  color: 'Dusty Rose',   colorCode: COLORS.dustyrose, stock: 9 },
      { size: 'M',  color: 'Dusty Rose',   colorCode: COLORS.dustyrose, stock: 11 },
      { size: 'L',  color: 'Dusty Rose',   colorCode: COLORS.dustyrose, stock: 8 },
      { size: 'XL', color: 'Dusty Rose',   colorCode: COLORS.dustyrose, stock: 5 },
      { size: 'S',  color: 'Cobalt Blue',  colorCode: COLORS.cobalt,    stock: 6 },
      { size: 'M',  color: 'Cobalt Blue',  colorCode: COLORS.cobalt,    stock: 8 },
      { size: 'L',  color: 'Cobalt Blue',  colorCode: COLORS.cobalt,    stock: 5 },
    ],
  },
  {
    name: 'Satin Slip Maxi Dress',
    slug: 'satin-slip-maxi-dress',
    category: 'maxi-dresses',
    price: 129,
    shortDescription: 'Minimalist satin slip maxi dress with a cowl neckline.',
    description: 'The ultimate in understated luxury — a sleek satin slip maxi dress with a fluid cowl neckline and barely-there straps. Wear alone or layer over a turtleneck for a fashion-forward look.',
    material: '100% Polyester Satin',
    careInstructions: 'Dry clean recommended. Hand wash cold as alternative.',
    tags: ['satin', 'slip', 'maxi', 'minimalist', 'cowl-neck'],
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=85', alt: 'Satin Slip Maxi Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Ivory',         colorCode: COLORS.ivory,   stock: 4 },
      { size: 'S',  color: 'Ivory',         colorCode: COLORS.ivory,   stock: 7 },
      { size: 'M',  color: 'Ivory',         colorCode: COLORS.ivory,   stock: 8 },
      { size: 'L',  color: 'Ivory',         colorCode: COLORS.ivory,   stock: 6 },
      { size: 'S',  color: 'Black',         colorCode: COLORS.black,   stock: 9 },
      { size: 'M',  color: 'Black',         colorCode: COLORS.black,   stock: 10 },
      { size: 'L',  color: 'Black',         colorCode: COLORS.black,   stock: 7 },
      { size: 'XL', color: 'Black',         colorCode: COLORS.black,   stock: 5 },
    ],
  },

  // ── MINI ─────────────────────────────────────────────────
  {
    name: 'Lace Bodycon Mini Dress',
    slug: 'lace-bodycon-mini-dress',
    category: 'mini-dresses',
    price: 89,
    comparePrice: 110,
    shortDescription: 'Figure-hugging lace bodycon mini with scalloped hem.',
    description: 'Sophisticated and sensual, this lace bodycon mini dress features intricate floral lace over a smooth lining. The scalloped hem and long sleeves add a touch of elegance to the daring silhouette.',
    material: 'Lace: 90% Nylon, 10% Elastane. Lining: 95% Polyester, 5% Elastane',
    careInstructions: 'Hand wash cold. Lay flat to dry.',
    tags: ['lace', 'bodycon', 'mini', 'party', 'date-night'],
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=85', alt: 'Lace Bodycon Mini Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Classic Black', colorCode: COLORS.black,   stock: 7 },
      { size: 'S',  color: 'Classic Black', colorCode: COLORS.black,   stock: 12 },
      { size: 'M',  color: 'Classic Black', colorCode: COLORS.black,   stock: 14 },
      { size: 'L',  color: 'Classic Black', colorCode: COLORS.black,   stock: 9 },
      { size: 'XL', color: 'Classic Black', colorCode: COLORS.black,   stock: 5 },
      { size: 'S',  color: 'Deep Red',      colorCode: COLORS.red,     stock: 6 },
      { size: 'M',  color: 'Deep Red',      colorCode: COLORS.red,     stock: 7 },
      { size: 'L',  color: 'Deep Red',      colorCode: COLORS.red,     stock: 4 },
    ],
  },
  {
    name: 'Puff Sleeve Mini Dress',
    slug: 'puff-sleeve-mini-dress',
    category: 'mini-dresses',
    price: 76,
    shortDescription: 'Playful mini dress with dramatic puff sleeves and a square neckline.',
    description: 'Make a statement with this charming mini dress featuring dramatic oversized puff sleeves and a flattering square neckline. The structured bodice and flared skirt create a feminine silhouette that\'s equal parts playful and chic.',
    material: '100% Cotton Poplin',
    careInstructions: 'Machine wash cold. Tumble dry low. Iron on medium.',
    tags: ['puff-sleeve', 'mini', 'cotton', 'square-neck', 'playful'],
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4d56?w=800&q=85', alt: 'Puff Sleeve Mini Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'White',         colorCode: COLORS.white,   stock: 5 },
      { size: 'S',  color: 'White',         colorCode: COLORS.white,   stock: 8 },
      { size: 'M',  color: 'White',         colorCode: COLORS.white,   stock: 10 },
      { size: 'L',  color: 'White',         colorCode: COLORS.white,   stock: 7 },
      { size: 'S',  color: 'Purple',        colorCode: COLORS.purple,  stock: 7 },
      { size: 'M',  color: 'Purple',        colorCode: COLORS.purple,  stock: 9 },
      { size: 'L',  color: 'Purple',        colorCode: COLORS.purple,  stock: 6 },
    ],
  },

  // ── CASUAL ───────────────────────────────────────────────
  {
    name: 'Ribbed Knit Midi Dress',
    slug: 'ribbed-knit-midi-dress',
    category: 'casual-dresses',
    price: 65,
    shortDescription: 'Comfortable ribbed knit midi dress with long sleeves.',
    description: 'Effortlessly chic for everyday wear, this ribbed knit midi dress combines comfort and style. The stretchy rib fabric hugs curves in all the right places while long sleeves keep you cozy. Perfect for errands, coffee dates, and casual evenings out.',
    material: '60% Viscose, 35% Nylon, 5% Elastane Rib Knit',
    careInstructions: 'Machine wash cold on gentle. Lay flat to dry.',
    tags: ['knit', 'ribbed', 'midi', 'casual', 'everyday', 'long-sleeve'],
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=85', alt: 'Ribbed Knit Midi Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Camel',         colorCode: '#c19a6b',      stock: 6 },
      { size: 'S',  color: 'Camel',         colorCode: '#c19a6b',      stock: 10 },
      { size: 'M',  color: 'Camel',         colorCode: '#c19a6b',      stock: 12 },
      { size: 'L',  color: 'Camel',         colorCode: '#c19a6b',      stock: 9 },
      { size: 'XL', color: 'Camel',         colorCode: '#c19a6b',      stock: 5 },
      { size: 'S',  color: 'Black',         colorCode: COLORS.black,   stock: 11 },
      { size: 'M',  color: 'Black',         colorCode: COLORS.black,   stock: 13 },
      { size: 'L',  color: 'Black',         colorCode: COLORS.black,   stock: 10 },
      { size: 'XL', color: 'Black',         colorCode: COLORS.black,   stock: 6 },
    ],
  },
  {
    name: 'Denim Shirt Dress',
    slug: 'denim-shirt-dress',
    category: 'casual-dresses',
    price: 72,
    comparePrice: 89,
    shortDescription: 'Classic denim shirt dress with a belted waist.',
    description: 'A wardrobe staple reimagined — this belted denim shirt dress goes from brunch to boutique shopping to casual evenings with ease. Features a collared neckline, button-through front, and removable tie belt.',
    material: '98% Cotton, 2% Elastane Denim',
    careInstructions: 'Machine wash cold with like colors. Tumble dry low.',
    tags: ['denim', 'shirt-dress', 'belted', 'casual', 'everyday'],
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1465296701794-09d58e5a35eb?w=800&q=85', alt: 'Denim Shirt Dress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Light Wash',    colorCode: '#a8c4d4',      stock: 5 },
      { size: 'S',  color: 'Light Wash',    colorCode: '#a8c4d4',      stock: 8 },
      { size: 'M',  color: 'Light Wash',    colorCode: '#a8c4d4',      stock: 10 },
      { size: 'L',  color: 'Light Wash',    colorCode: '#a8c4d4',      stock: 7 },
      { size: 'XL', color: 'Light Wash',    colorCode: '#a8c4d4',      stock: 4 },
      { size: 'S',  color: 'Dark Wash',     colorCode: '#2c3e6b',      stock: 7 },
      { size: 'M',  color: 'Dark Wash',     colorCode: '#2c3e6b',      stock: 9 },
      { size: 'L',  color: 'Dark Wash',     colorCode: '#2c3e6b',      stock: 6 },
    ],
  },

  // ── SUMMER ───────────────────────────────────────────────
  {
    name: 'Linen Sundress',
    slug: 'linen-sundress',
    category: 'summer-dresses',
    price: 58,
    shortDescription: 'Breezy linen sundress with adjustable straps and a tiered skirt.',
    description: 'Beat the heat in style with this effortless linen sundress. The breathable linen fabric keeps you cool while the tiered skirt adds playful volume. Adjustable shoulder straps ensure the perfect fit. Pairs beautifully with sandals and a sun hat.',
    material: '55% Linen, 45% Cotton',
    careInstructions: 'Machine wash cold. Tumble dry low. Expect natural wrinkles.',
    tags: ['linen', 'sundress', 'summer', 'beach', 'tiered'],
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=85', alt: 'Linen Sundress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'White',         colorCode: COLORS.white,   stock: 8 },
      { size: 'S',  color: 'White',         colorCode: COLORS.white,   stock: 12 },
      { size: 'M',  color: 'White',         colorCode: COLORS.white,   stock: 14 },
      { size: 'L',  color: 'White',         colorCode: COLORS.white,   stock: 10 },
      { size: 'XL', color: 'White',         colorCode: COLORS.white,   stock: 6 },
      { size: 'S',  color: 'Sky Blue',      colorCode: '#87ceeb',      stock: 9 },
      { size: 'M',  color: 'Sky Blue',      colorCode: '#87ceeb',      stock: 11 },
      { size: 'L',  color: 'Sky Blue',      colorCode: '#87ceeb',      stock: 8 },
      { size: 'S',  color: 'Terracotta',    colorCode: '#c17f5c',      stock: 7 },
      { size: 'M',  color: 'Terracotta',    colorCode: '#c17f5c',      stock: 8 },
      { size: 'L',  color: 'Terracotta',    colorCode: '#c17f5c',      stock: 5 },
    ],
  },
  {
    name: 'Floral Wrap Sundress',
    slug: 'floral-wrap-sundress',
    category: 'summer-dresses',
    price: 69,
    comparePrice: 85,
    shortDescription: 'Vibrant floral wrap sundress with a v-neckline and midi length.',
    description: 'Channel resort-chic energy in this vibrant floral wrap sundress. The adjustable wrap tie creates a customizable fit, while the midi length keeps things tasteful and sophisticated. A vacation wardrobe essential.',
    material: '100% Viscose',
    careInstructions: 'Hand wash cold. Do not tumble dry. Iron on low heat.',
    tags: ['floral', 'wrap', 'sundress', 'summer', 'resort', 'vacation'],
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1487147264018-f937fba0c817?w=800&q=85', alt: 'Floral Wrap Sundress', isPrimary: true },
    ],
    variants: [
      { size: 'XS', color: 'Tropical Print', colorCode: '#e8824a',    stock: 5 },
      { size: 'S',  color: 'Tropical Print', colorCode: '#e8824a',    stock: 9 },
      { size: 'M',  color: 'Tropical Print', colorCode: '#e8824a',    stock: 11 },
      { size: 'L',  color: 'Tropical Print', colorCode: '#e8824a',    stock: 8 },
      { size: 'XL', color: 'Tropical Print', colorCode: '#e8824a',    stock: 4 },
      { size: 'S',  color: 'Garden Floral',  colorCode: '#e8b4c8',    stock: 7 },
      { size: 'M',  color: 'Garden Floral',  colorCode: '#e8b4c8',    stock: 9 },
      { size: 'L',  color: 'Garden Floral',  colorCode: '#e8b4c8',    stock: 6 },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create or find categories
    const categoryMap = {};
    for (const cat of categories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (existing) {
        categoryMap[cat.slug] = existing._id;
        console.log(`Category exists: ${cat.name}`);
      } else {
        const created = await Category.create(cat);
        categoryMap[cat.slug] = created._id;
        console.log(`Created category: ${cat.name}`);
      }
    }

    // Seed products
    let created = 0;
    let skipped = 0;
    for (const p of products) {
      const existing = await Product.findOne({ slug: p.slug });
      if (existing) {
        console.log(`Skipped (exists): ${p.name}`);
        skipped++;
        continue;
      }
      const { category: catSlug, ...rest } = p;
      await Product.create({ ...rest, category: categoryMap[catSlug] });
      console.log(`Created: ${p.name}`);
      created++;
    }

    console.log(`\nDone! Created ${created} products, skipped ${skipped} existing.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
