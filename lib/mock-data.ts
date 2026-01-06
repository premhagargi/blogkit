export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  type: 'BLOG';
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  createdAt: Date;
  updatedAt: Date;
  author: string;
  publishedAt: Date | null;
}

export const blogPostsMock: BlogPost[] = [
  {
    id: '1',
    title: 'How to Market B2B SaaS Products on Reddit',
    slug: 'how-to-market-b2b-saas-products-on-reddit',
    type: 'BLOG',
    status: 'PUBLISHED',
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-08-16'),
    author: 'A',
    publishedAt: new Date('2025-08-15'),
  },
  {
    id: '2',
    title: 'The Ultimate Guide to Content Repurposing',
    slug: 'ultimate-guide-content-repurposing',
    type: 'BLOG',
    status: 'PUBLISHED',
    createdAt: new Date('2025-07-20'),
    updatedAt: new Date('2025-08-10'),
    author: 'B',
    publishedAt: new Date('2025-07-20'),
  },
  {
    id: '3',
    title: '10 SEO Mistakes to Avoid in 2025',
    slug: '10-seo-mistakes-to-avoid-2025',
    type: 'BLOG',
    status: 'DRAFT',
    createdAt: new Date('2025-08-12'),
    updatedAt: new Date('2025-08-12'),
    author: 'C',
    publishedAt: null,
  },
  {
    id: '4',
    title: 'Building a Design System from Scratch',
    slug: 'building-design-system-from-scratch',
    type: 'BLOG',
    status: 'SCHEDULED',
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-05'),
    author: 'A',
    publishedAt: new Date('2025-09-01'),
  },
  {
    id: '5',
    title: 'The Rise of AI in Digital Marketing',
    slug: 'rise-of-ai-in-digital-marketing',
    type: 'BLOG',
    status: 'PUBLISHED',
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2025-07-15'),
    author: 'B',
    publishedAt: new Date('2025-06-10'),
  },
  {
    id: '6',
    title: 'A Deep Dive into Serverless Architectures',
    slug: 'deep-dive-serverless-architectures',
    type: 'BLOG',
    status: 'DRAFT',
    createdAt: new Date('2025-08-14'),
    updatedAt: new Date('2025-08-14'),
    author: 'C',
    publishedAt: null,
  },
  // {
  //   id: '7',
  //   title: 'How We Increased Conversion Rates by 50%',
  //   slug: 'how-we-increased-conversion-rates',
  //   type: 'BLOG',
  //   status: 'PUBLISHED',
  //   createdAt: new Date('2025-05-25'),
  //   updatedAt: new Date('2025-06-01'),
  //   author: 'A',
  //   publishedAt: new Date('2025-05-25'),
  // },
  // {
  //   id: '8',
  //   title: 'Next.js 16: What to Expect',
  //   slug: 'next-js-16-what-to-expect',
  //   type: 'BLOG',
  //   status: 'SCHEDULED',
  //   createdAt: new Date('2025-08-10'),
  //   updatedAt: new Date('2025-08-11'),
  //   author: 'B',
  //   publishedAt: new Date('2025-08-20'),
  // },
  // {
  //   id: '9',
  //   title: 'Mastering Product Management: A Starter Guide',
  //   slug: 'mastering-product-management-starter-guide',
  //   type: 'BLOG',
  //   status: 'PUBLISHED',
  //   createdAt: new Date('2025-04-30'),
  //   updatedAt: new Date('2025-05-05'),
  //   author: 'C',
  //   publishedAt: new Date('2025-04-30'),
  // },
  // {
  //   id: '10',
  //   title: 'The Psychology of Color in Branding',
  //   slug: 'psychology-of-color-in-branding',
  //   type: 'BLOG',
  //   status: 'DRAFT',
  //   createdAt: new Date('2025-08-16'),
  //   updatedAt: new Date('2025-08-16'),
  //   author: 'A',
  //   publishedAt: null,
  // },
];
