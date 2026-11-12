import beautyBanner from '../assets/BeautyBanner.png';
import faceMask from '../assets/FaceMask.png';
import faceToner from '../assets/Face Toner.png';
import faceWash from '../assets/Face wash.png';
import heroBanner from '../assets/Hero Banner.png';
import moisturizer from '../assets/Moistrizer.png';
import skinCareTexture from '../assets/SkinCare Texture.png';
import skinoraLogo from '../assets/Skinora_Logo.png';
import sunScreen from '../assets/Sun Screen Cream.png';
import vitaminC from '../assets/Vitamin C serum.png';

export const logoImage = skinoraLogo;
export const heroImage = heroBanner;
export const beautyImage = beautyBanner;
export const textureImage = skinCareTexture;

export const initialProducts = [
  {
    id: 'P001',
    name: 'Vitamin C Serum',
    price: 1200,
    description: 'Brightening serum infused with vitamin C and antioxidant protection for a visibly glowing complexion.',
    category: 'Serum',
    stock: 24,
    image: vitaminC,
  },
  {
    id: 'P002',
    name: 'Hydrating Moisturizer',
    price: 1350,
    description: 'A lightweight, deeply hydrating moisturizer that locks in moisture and restores skin softness.',
    category: 'Moisturizer',
    stock: 18,
    image: moisturizer,
  },
  {
    id: 'P003',
    name: 'Gentle Face Wash',
    price: 980,
    description: 'Creamy cleanser that removes impurities while keeping the skin balanced, calm, and refreshed.',
    category: 'Cleanser',
    stock: 32,
    image: faceWash,
  },
  {
    id: 'P004',
    name: 'Radiance Face Mask',
    price: 1450,
    description: 'Nourishing mask that revives dull skin and leaves a silky-smooth, bright finish.',
    category: 'Mask',
    stock: 15,
    image: faceMask,
  },
  {
    id: 'P005',
    name: 'Rose Dew Toner',
    price: 1100,
    description: 'A soothing toner that preps skin, hydrates deeply, and supports a healthy glow.',
    category: 'Toner',
    stock: 28,
    image: faceToner,
  },
  {
    id: 'P006',
    name: 'Sun Shield Cream',
    price: 1600,
    description: 'High-protection sunscreen that shields skin from UV damage while staying comfortable all day.',
    category: 'Sunscreen',
    stock: 21,
    image: sunScreen,
  },
];

export const categories = [
  { name: 'Serum', img: vitaminC },
  { name: 'Moisturizer', img: moisturizer },
  { name: 'Cleanser', img: faceWash },
  { name: 'Mask', img: faceMask },
  { name: 'Toner', img: faceToner },
  { name: 'Sunscreen', img: sunScreen },
];

export const testimonials = [
  {
    name: 'Aisha Malik',
    text: 'The texture feels luxurious and my skin looks brighter within weeks. SKINORA feels like a spa ritual every day.',
  },
  {
    name: 'Nadia Khan',
    text: 'I love the glow this brand gives me. The products are elegant, effective, and perfect for my sensitive skin.',
  },
  {
    name: 'Maya Rahman',
    text: 'The best skincare brand I have tried for hydration and hydration layering. My skin feels soft and healthy.',
  },
];

export const sampleOrders = [
  {
    id: 'ORD-101',
    customerName: 'Aisha Malik',
    email: 'aisha@example.com',
    products: 'Vitamin C Serum x 2',
    total: 2400,
    status: 'Processing',
    date: '2026-11-04',
  },
  {
    id: 'ORD-102',
    customerName: 'Nadia Khan',
    email: 'nadia@example.com',
    products: 'Hydrating Moisturizer x 1',
    total: 1350,
    status: 'Shipped',
    date: '2026-11-06',
  },
  {
    id: 'ORD-103',
    customerName: 'Maya Rahman',
    email: 'maya@example.com',
    products: 'Sun Shield Cream x 1, Gentle Face Wash x 2',
    total: 3320,
    status: 'Delivered',
    date: '2026-11-09',
  },
];
