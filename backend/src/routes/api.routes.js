// Mini App uchun ochiq API (Express 5: async xatolar avtomatik ushlanadi)
import { Router } from 'express';
import { telegramUser, requireTelegramUser, requireAdmin } from '../middlewares/auth.middleware.js';
import * as products from '../controllers/productController.js';
import * as orders from '../controllers/orderController.js';
import * as cart from '../controllers/cartController.js';
import * as admin from '../controllers/adminController.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
router.get('/images/:id', products.getImage);

router.use(telegramUser);

router.get('/catalog', products.catalog);
router.get('/products/:id', products.getProduct);
router.get('/search', products.search);
router.post('/share/:id', products.prepareShare);

router.post('/cart/quote', cart.quote);
router.post('/orders', rateLimit({ windowMs: 60_000, max: 5 }), orders.createOrder);
router.get('/orders/:publicId', orders.getOrder);
router.get('/me/orders', requireTelegramUser, orders.myOrders);

// ---------- Admin ----------
router.post('/admin/login', rateLimit({ windowMs: 60_000, max: 10 }), admin.login);
router.post('/admin/tg-login', admin.telegramLogin);

router.use('/admin', requireAdmin);
router.get('/admin/stats', admin.stats);
router.get('/admin/orders', admin.listOrders);
router.get('/admin/orders/:id', admin.getOrder);
router.patch('/admin/orders/:id', admin.updateOrder);
router.get('/admin/products', admin.listProducts);
router.post('/admin/products', admin.createProduct);
router.patch('/admin/products/:id', admin.updateProduct);
router.delete('/admin/products/:id', admin.deleteProduct);
router.post('/admin/images', admin.uploadImage);
router.get('/admin/categories', admin.listCategories);
router.post('/admin/categories', admin.createCategory);
router.patch('/admin/categories/:id', admin.updateCategory);
router.delete('/admin/categories/:id', admin.deleteCategory);
router.get('/admin/settings', admin.getSettings);
router.put('/admin/settings', admin.saveSettings);
router.get('/admin/bot', admin.botStatus);
router.post('/admin/bot/setup', admin.setupBot);

export default router;
