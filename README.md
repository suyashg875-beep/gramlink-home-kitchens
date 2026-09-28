# GramLink Home Kitchens

Build a mobile-first web app called "GramLink": a marketplace where rural and semi-urban homemade food makers (pickles, papad, masalas, puran poli, laddoo, snacks) sell directly to nearby customers in India. Use React + Tailwind on the frontend and Supabase for auth, database, and storage. Use a warm, friendly green and saffron theme with large buttons, simple forms, and easy English.

THREE ROLES (chosen at signup, except admin, which is set manually in the database):
1. Customer 2. Seller 3. Admin

CUSTOMER FEATURES
- Sign up, log in, log out
- Choose an area/pincode on first visit
- Home page showing products from sellers in that area, with a search bar and category chips (Pickles, Papad, Masalas, Sweets, Snacks, Other)
- Product page: photos, description, price, stock, seller name, "✓ GramLink Verified Seller" badge, ratings
- Seller profile page with their products and reviews
- Cart (add, remove, change quantity, total)
- Checkout with name, phone, and delivery address. Payment is Cash on Delivery only.
- Order tracking page and order history
- After an order is completed, the customer can give a 1 to 5 star rating and a written review

SELLER FEATURES
- Sign up, then complete a profile: business name, about, village/area, pincode, FSSAI number (optional), and upload verification documents to a PRIVATE storage bucket
- Status shown on the dashboard: Pending / Verified / Rejected
- Only VERIFIED sellers can publish products
- Add/edit/delete products: name, category, price, stock, availability toggle, publish/unpublish, and photo upload
- AI DESCRIPTION: after uploading a product photo, a "Generate description" button calls an AI model (through a Supabase Edge Function, never exposing the API key in the browser) to suggest a short, appealing product description. The seller can use it, edit it, or regenerate it.
- Orders inbox with Accept/Reject, then status updates: Accepted → Preparing → Ready → Completed
- Dashboard: total orders, pending, completed, cancelled, total earnings, recent orders
- See customer reviews and average rating

ADMIN FEATURES
- Admin dashboard with counts: Total, Pending, Verified, Rejected sellers
- Seller list with filters
- Seller detail page with submitted info and documents (open through short-lived signed URLs)
- Approve / Reject buttons

DATABASE (Supabase Postgres) tables: profiles (id, full_name, phone, role), seller_profiles (user_id, business_name, about, village_or_area, pincode, fssai_number, document_urls, status), products, orders, order_items, reviews.

SECURITY (very important)
- Enable Row Level Security on every table
- Users cannot change their own role
- Sellers cannot change their own verification status; only admins can
- Customers see only their own orders and sellers see only orders for their products
- Only verified sellers' published products are visible to customers
- Verification documents are private and readable only by the owner and admins
- Reviews are allowed only for the customer's own completed orders

Do NOT build: online payments, delivery partners, GPS, or chat. Keep the code simple and clean.

Start with authentication, roles, seller onboarding, and the admin verification flow. Then build products, customer browsing, cart/orders, and reviews.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/975401a4-8e13-450d-b61d-4f9a9c0511ee).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
