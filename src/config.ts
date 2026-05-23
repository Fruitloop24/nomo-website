/**
 * ============================================================================
 * SITE CONFIG — Edit this file to customize everything
 * ============================================================================
 *
 * One file. Change it here, it changes everywhere.
 * All pages and components import from this file.
 */

export const CONFIG = {
  // ─── BRAND ───
  appName: 'NoMo Junk',
  tagline: 'Junk Removal & Dumpster Rentals — Less Mess. Less Stress.',
  yearStarted: 2022, // TODO: confirm from FB page
  trustCount: 'Middle Georgia',

  // ─── IMAGES ───
  images: {
    logo: '/logo.jpg',
    logoTransparent: '/logo.jpg',
    logoSmall: '/logo.jpg',
    hero: '/logo.jpg', // TODO: real action shot (truck loading, dumpster on driveway)
    dumpster: '/photos/dumpster-main.jpg', // branded roll-off — used on /rent + home dumpster section
    beforeAfters: [
      { title: 'Garage / Home Cleanout', location: 'Middle GA', before: '/photos/befor-garage.jpg', after: '/photos/after-garage.jpg' },
      { title: 'Commercial / Lot Cleanup', location: 'Middle GA', before: '/photos/before-field.jpg', after: '/photos/after-field.jpg' },
      { title: 'The Impossible', location: 'Middle GA', before: '/photos/before-barn.jpg', after: '/photos/after-barn.jpg' },
    ],
    // Replaces the old "What We Do" text blocks — three real job types.
    workCategories: [
      { label: 'Home Cleanouts', sub: 'Garages, attics, whole houses', img: '/photos/home-cleanout.jpg' },
      { label: 'Commercial Jobs', sub: 'Lots, rentals, properties', img: '/photos/commercial-cleanout.jpg' },
      { label: 'The Impossible', sub: "If you can point at it, we'll haul it", img: '/photos/impossible-cleanout.jpg' },
    ],
    colby: '/photos/colby-profile.jpg',
  },

  // ─── CONTACT ───
  website: 'nomo-website.pages.dev',
  phone: {
    raw: '4782859915',
    display: '(478) 285-9915',
    href: 'tel:+14782859915',
  },
  email: 'nomojunk89@gmail.com',
  address: {
    street: '724 5th Ave',
    city: 'Eastman',
    state: 'GA',
    zip: '31023', // inferred standard Eastman, GA ZIP — confirm
    full: '724 5th Ave, Eastman, GA 31023',
    region: 'Middle Georgia',
  },
  // Cities/towns we cover — drives footer list + LocalBusiness areaServed + FAQ.
  areasServed: [
    'Macon',
    'Warner Robins',
    'Perry',
    'Kathleen',
    'Dublin',
    'Cordele',
    'Eastman',
    'Cochran',
    'Gray',
    'Douglas',
    'Butler',
  ],
  hours: {
    weekday: 'Monday – Saturday: 7:00 AM – 7:00 PM',
    weekend: 'Sunday: By appointment',
  },

  // ─── CTA / BOOKING ───
  booking: '/book',
  bookingApi: {
    // Same backend the flooring site uses — just a different source_site tag.
    base: 'https://hetzner.cerul.org',
    sourceSite: 'nomo-website.pages.dev',
    hoursLabel: 'Mon – Sat · 7 AM – 7 PM',
    requestPath: '/public/book/request',
    confirmPath: '/public/book/confirm',
    // Dumpster reservation (Cerul "store-reserve" contract) — separate from junk booking.
    // availability → Cerul recommends open drop→pickup spans (rotating units A/B/C).
    // checkout → Cerul computes price (+ tax), mints a Stripe Checkout Session, and
    //            returns { checkout_url }. We never touch Stripe; the booking is created
    //            on Cerul's signed webhook after payment. We just collect info + redirect.
    reserveAvailabilityPath: '/public/reserve/availability',
    reserveCheckoutPath: '/public/reserve/checkout',
  },

  // ─── DUMPSTER RENTAL — one size, rented by date (fleet of 3 units) ───
  rental: {
    name: '7×16×4 Roll-Off Dumpster',
    dims: '7 ft × 16 ft × 4 ft',
    capacity: 'About 5–7 pickup-truck loads',
    basePrice: 425, // includes drop-off + pickup + first ton + 2 days
    includedDays: 2,
    includedTons: 1,
    perExtraDay: 100,
    units: 3,
    bestFor: ['Home clean-outs', 'Renovations', 'Junk-removal projects'],
    prohibited: ['hazardous waste', 'wet paint', 'asbestos', 'tires', 'chemicals'],
  },
  cta: {
    primary: {
      text: 'Book a Free Estimate',
      href: '/book',
    },
    secondary: {
      text: 'Rent a Dumpster',
      href: '/rent',
    },
    quote: {
      text: 'Get Your Free Quote',
      href: '/book',
    },
    call: {
      text: 'Call Now',
      href: 'tel:+14782859915', // mirror phone.href
    },
    email: {
      text: 'Email Us',
      href: 'mailto:nomojunk89@gmail.com',
    },
    mobileCta: {
      text: 'Book Now',
      href: '/book',
    },
  },

  // ─── NAVIGATION ───
  nav: [
    { to: '/', label: 'Home' },
    { to: '/estimate', label: 'Estimator' },
    { to: '/rent', label: 'Rent Dumpster' },
    { to: '/about', label: 'About' },
  ],
  mobileNav: [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/rent', label: 'Rent', icon: 'rent' },
    { to: '/about', label: 'About', icon: 'about' },
    { to: 'tel:+14782859915', label: 'Call', icon: 'call', external: true },
  ],

  // ─── HERO ───
  hero: {
    badge: 'Middle Georgia · Family-Owned · Same-Week Service',
    headline: 'Haul It Off.',
    headlineAccent: "We'll Handle The Rest.",
    subheadline:
      'Junk removal and roll-off dumpster rentals in Middle Georgia. Garage cleanouts, estate jobs, construction debris, storm cleanup — we show up, load it up, and haul it off. Less mess. Less stress.',
    features: [
      { label: 'Free Estimates', icon: '📋' },
      { label: 'Same-Week Service', icon: '⚡' },
      { label: 'Licensed & Insured', icon: '🛡️' },
      { label: 'Locally Owned', icon: '🏠' },
    ],
  },

  // ─── SERVICES ───
  services: {
    headline: 'Less Mess. Less Stress.',
    subheadline:
      "If you can point at it, we can haul it. Single items to whole-house cleanouts — and if you'd rather load it yourself, we'll drop a dumpster on your driveway.",
    items: [
      {
        title: 'Full-Service Junk Removal',
        desc: 'You point, we load. Furniture, appliances, yard waste, construction debris — we handle it all.',
        icon: 'truck',
      },
      {
        title: 'Dumpster Rentals',
        desc: 'Roll-off dumpsters dropped on your driveway. Keep it for the weekend or the week — your call.',
        icon: 'dumpster',
      },
      {
        title: 'Garage & Attic Cleanouts',
        desc: "Decades of stuff you've been meaning to deal with? We'll have it gone in an afternoon.",
        icon: 'home',
      },
      {
        title: 'Estate & Move-Out Clean Outs',
        desc: 'Whole-house clears handled with respect. We sort, donate where we can, and haul the rest.',
        icon: 'box',
      },
      {
        title: 'Construction & Reno Debris',
        desc: 'Drywall, flooring tear-out, roofing — schedule a haul or stage a dumpster on-site.',
        icon: 'hammer',
      },
      {
        title: 'Storm & Yard Cleanup',
        desc: "After a storm, after a big yard project — we're the call that makes the pile go away.",
        icon: 'leaf',
      },
    ],
  },

  // ─── DUMPSTER (estimator tab) — one size, real price ───
  dumpsters: [
    {
      id: '7x16x4',
      name: '7×16×4 Roll-Off',
      tagline: 'One size, does it all',
      capacity: 'About 5–7 pickup loads',
      price: 425, // 2 days + first ton; +$100/extra day
      days: 2,
      bestFor: ['Home clean-outs', 'Renovations', 'Junk-removal projects'],
    },
  ],

  // ─── REVIEWS — real, from facebook.com/NoMoJunkMiddleGa ───
  reviews: {
    count: 25, // 25+ all-five-star recommendations on Facebook
    countLabel: '25+',
    rating: 5,
    platform: 'Facebook',
    href: 'https://www.facebook.com/NoMoJunkMiddleGa/reviews',
    badge: '25+ Five-Star Reviews on Facebook',
  },

  // ─── TESTIMONIALS — real recommendations pulled from the FB page ───
  testimonials: [
    {
      name: 'Lisa Chormicle Morris',
      date: 'Jun 2023',
      rating: 5,
      project: 'Yard & junk cleanout',
      source: 'Facebook',
      text: "NoMo Junk did an amazing job for us, removing 12 years of collected junk! They were very professional, arrived on time, and exceeded our expectations. If you're feeling overwhelmed trying to do a big cleanup yourself — like I was — do not hesitate to call them. It was worth every penny and took a ton of stress away!",
    },
    {
      name: 'Brian Pack',
      date: 'May 2023',
      rating: 5,
      project: 'Next-day debris haul',
      source: 'Facebook',
      text: 'Great communication and responded quickly to my request. They could come out the next day — sooner than I anticipated. They talked through where to park before loading debris and made sure the right items were removed. I will definitely hire again.',
    },
    {
      name: 'Thomas Realty',
      date: 'Apr 2023',
      rating: 5,
      project: 'Rental property cleanout',
      source: 'Facebook',
      text: "We asked NoMo Junk to clear debris, trash, and junk from a client's rental property. The house was completely full of stuff, plus the back yard. They got it done in just a few days — it was hard to believe it was the same property when they finished. Such a positive experience; we'll definitely call them again.",
    },
    {
      name: 'Claude Landrum',
      date: '',
      rating: 5,
      project: 'Move-in cleanout',
      source: 'Facebook',
      text: "Colby did a great job for us. We'd just moved to the area and had lots of moving boxes and trash. He was nice, professional, and we'll be using him again. You won't regret using him!",
    },
    {
      name: 'Kylee Gordon',
      date: 'Jun 2023',
      rating: 5,
      project: 'Junk pickup',
      source: 'Facebook',
      text: 'Excellent service! Thank you!',
    },
    {
      name: 'James Lauren Burney',
      date: '',
      rating: 5,
      project: 'Junk removal',
      source: 'Facebook',
      text: 'Very helpful and a great price for services! Would recommend to anyone!',
    },
  ],

  // ─── SOCIAL ───
  socials: [
    { name: 'Facebook', href: 'https://www.facebook.com/NoMoJunkMiddleGa' },
  ],

  // ─── FAQ ───
  faqs: [
    {
      q: 'What does junk removal cost?',
      a: "Pricing is based on volume — how much room your stuff takes up in the truck. We'll give you a firm price before we load anything. No hidden fees, no surprises. Most single-item pickups run $75–$150; bigger jobs are quoted on-site.",
    },
    {
      q: 'How fast can you come out?',
      a: "Most jobs in Middle Georgia get same-week service, and we can often do next-day or same-day if you call before noon. Book online or give us a ring.",
    },
    {
      q: 'What can you take?',
      a: "Almost anything that isn't hazardous — furniture, appliances, mattresses, electronics, yard waste, construction debris, hot tubs, sheds, you name it. We can't haul paint, chemicals, tires, or asbestos, but we can point you to who does.",
    },
    {
      q: 'Do I need to be home?',
      a: "Not if the stuff is accessible — driveway, curb, open garage, backyard. Just send us a photo and instructions, and we'll handle it and text you when we're done.",
    },
    {
      q: 'How does a dumpster rental work?',
      a: "Pick your size and dates online, pay, and we drop it on your driveway on the scheduled day. Fill it on your own time — we come back and haul it at the end of your rental. Easy.",
    },
    {
      q: 'How long can I keep a dumpster?',
      a: "Standard rental is 5–7 days depending on size. Need it longer? Just let us know — we can almost always extend.",
    },
    {
      q: 'What areas do you serve?',
      a: "We cover Middle Georgia — including Macon, Warner Robins, Perry, Kathleen, Dublin, Cordele, Eastman, Cochran, Gray, Douglas, and Butler. Not sure if we reach you? Just call — if you're nearby, we'll make it work.",
    },
    {
      q: 'Are you licensed and insured?',
      a: "Yes. Fully licensed and insured — we treat your property like our own.",
    },
  ],

  // ─── ESTIMATOR PRICING ───
  // Pumped over national typical so we can usually beat the quote.
  // "We can usually beat it" — and we mean it. Real quotes come in under the low.
  pricing: {
    // Load-size buckets — click-cards, no slider.
    // Each bucket has its own range so the math is just a lookup.
    loadSizes: [
      {
        id: 'single',
        label: 'Single Item',
        sub: 'Couch, fridge, one thing',
        emoji: '📦',
        low: 95,
        high: 165,
      },
      {
        id: '1-8',
        label: '1/8 Truck',
        sub: 'Closet purge · a few boxes',
        emoji: '🧺',
        low: 135,
        high: 195,
      },
      {
        id: '1-4',
        label: '1/4 Truck',
        sub: 'Single room · pickup load',
        emoji: '🛏️',
        low: 215,
        high: 295,
      },
      {
        id: '1-2',
        label: '1/2 Truck',
        sub: 'Garage cleanout',
        emoji: '🚗',
        low: 345,
        high: 465,
      },
      {
        id: '3-4',
        label: '3/4 Truck',
        sub: 'Attic + garage · big basement',
        emoji: '🏚️',
        low: 495,
        high: 625,
      },
      {
        id: 'full',
        label: 'Full Truck',
        sub: 'Whole-house cleanout',
        emoji: '🏠',
        low: 695,
        high: 895,
      },
    ],
    // Flat add-ons — toggled or counted in the estimator.
    addOns: [
      { id: 'fridge', label: 'Fridge / freezer / AC', sub: 'Refrigerant', price: 45 },
      { id: 'mattress', label: 'Mattress / box spring', sub: 'Recycle fee', price: 35 },
      { id: 'tv', label: 'TV / monitor / e-waste', sub: 'Per item', price: 35 },
      { id: 'tire', label: 'Tires', sub: 'Per tire', price: 12 },
      { id: 'hotTub', label: 'Hot tub', sub: 'Disassembly included', price: 395 },
      { id: 'piano', label: 'Piano', sub: 'Upright or grand', price: 225 },
    ],
    // Job conditions — flat surcharges.
    conditions: [
      { id: 'stairs', label: 'Stairs (more than one flight)', price: 50 },
      { id: 'longCarry', label: 'Long carry (50+ ft from truck)', price: 45 },
      { id: 'heavyMaterial', label: 'Heavy material (concrete, tile, dirt, shingles)', price: 95 },
      { id: 'demo', label: 'Demolition / disassembly needed', price: 125 },
    ],
  },

  // ─── FOOTER ───
  footer: {
    tagline: 'Junk removal & dumpster rentals across Middle Georgia. Less mess. Less stress.',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Rent a Dumpster', to: '/rent' },
      { label: 'Book a Pickup', to: '/book' },
      { label: 'About', to: '/about' },
    ],
  },
}
