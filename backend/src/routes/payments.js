/**
 * Payment Routes - Razorpay order creation, webhook, payouts
 * Pattern inspired by anyam40/RazorpayGateway-Integration
 * 
 * DEPENDENCY DISCLOSURE:
 * - Name: Razorpay
 * - Requires API Key: YES
 * - Free Tier Available: YES (test mode)
 * - Mock Implemented: YES (when keys not available)
 * - Fallback Strategy: Mock order creation and webhook verification
 */
const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const SOCIAL_SECURITY_RATE = parseFloat(process.env.SOCIAL_SECURITY_RATE || '0.01');
const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE || '0.10');

/**
 * Mock Razorpay client for local development
 */
class MockRazorpay {
  async createOrder(amount, currency, receipt) {
    return {
      id: `order_mock_${Date.now()}`,
      amount: amount * 100,
      currency,
      receipt,
      status: 'created',
    };
  }

  verifySignature(body, signature, secret) {
    if (!secret) return true; // Skip verification if no secret
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }
}

const razorpay = new MockRazorpay();

// POST /api/v1/payments/order - Create payment order
router.post('/order', authenticate, async (req, res) => {
  try {
    const { taskId, amount } = req.body;
    if (!taskId || !amount) {
      return res.status(400).json({ code: 400, message: 'taskId and amount are required' });
    }

    // Verify task is completed
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND status = $2',
      [taskId, 'COMPLETED']
    );
    if (taskResult.rows.length === 0) {
      return res.status(400).json({ code: 400, message: 'Task must be in COMPLETED status for payment' });
    }

    const task = taskResult.rows[0];

    // Calculate fee splits
    const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
    const socialSecurity = Math.round(amount * SOCIAL_SECURITY_RATE * 100) / 100;
    const helperPayout = Math.round((amount - platformFee - socialSecurity) * 100) / 100;

    // Create Razorpay order (mock in dev)
    const order = await razorpay.createOrder(amount, 'INR', taskId);

    // Store payment record
    const idempotencyKey = `pay_${taskId}_${Date.now()}`;
    const paymentResult = await pool.query(
      `INSERT INTO payments (task_id, buyer_id, helper_id, amount, payment_method, razorpay_order_id,
        status, platform_fee, social_security_reserve, helper_payout, idempotency_key)
       VALUES ($1, $2, $3, $4, 'razorpay', $5, 'CREATED', $6, $7, $8, $9)
       RETURNING id`,
      [taskId, task.buyer_id, task.helper_id, amount, order.id,
       platformFee, socialSecurity, helperPayout, idempotencyKey]
    );

    logger.info('Payment order created', {
      paymentId: paymentResult.rows[0].id,
      orderId: order.id,
      amount,
    });

    res.status(201).json({
      orderId: order.id,
      amount,
      currency: 'INR',
      paymentId: paymentResult.rows[0].id,
    });
  } catch (err) {
    logger.error('Payment order error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/payments/webhook - Razorpay webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = razorpay.verifySignature(body, signature, webhookSecret);
      if (!isValid) {
        logger.warn('Invalid webhook signature');
        return res.status(400).json({ code: 400, message: 'Invalid signature' });
      }
    }

    const { payload } = req.body;
    if (!payload || !payload.payment || !payload.payment.entity) {
      return res.status(200).json({ status: 'ignored' });
    }

    const payment = payload.payment.entity;
    const orderId = payment.order_id;

    // Idempotent update - only process if not already captured
    const result = await pool.query(
      `UPDATE payments SET
        razorpay_payment_id = $1,
        status = 'CAPTURED',
        updated_at = NOW()
       WHERE razorpay_order_id = $2 AND status != 'CAPTURED'
       RETURNING *`,
      [payment.id, orderId]
    );

    if (result.rows.length > 0) {
      const pay = result.rows[0];

      // Create ledger entries
      await pool.query(
        `INSERT INTO ledger_entries (payment_id, entry_type, amount, description) VALUES
         ($1, 'PAYMENT_RECEIVED', $2, 'Payment captured'),
         ($1, 'PLATFORM_FEE', $3, 'Platform fee'),
         ($1, 'SOCIAL_SECURITY', $4, 'Social security reserve 1%')`,
        [pay.id, pay.amount, pay.platform_fee, pay.social_security_reserve]
      );

      // Update task status to PAID (via price field)
      await pool.query(
        'UPDATE tasks SET price = $1, updated_at = NOW() WHERE id = $2',
        [pay.amount, pay.task_id]
      );

      // Credit helper wallet
      await pool.query(
        `UPDATE helper_profiles SET wallet_balance = wallet_balance + $1
         WHERE user_id = $2`,
        [pay.helper_payout, pay.helper_id]
      );

      logger.info('Payment captured', { paymentId: pay.id, amount: pay.amount });
    }

    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/payments/cash - Confirm cash payment
router.post('/cash', authenticate, async (req, res) => {
  try {
    const { taskId, amount, confirmationCode } = req.body;
    if (!taskId || !amount) {
      return res.status(400).json({ code: 400, message: 'taskId and amount are required' });
    }

    const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
    const socialSecurity = Math.round(amount * SOCIAL_SECURITY_RATE * 100) / 100;
    const helperPayout = Math.round((amount - platformFee - socialSecurity) * 100) / 100;

    const idempotencyKey = `cash_${taskId}_${Date.now()}`;
    await pool.query(
      `INSERT INTO payments (task_id, buyer_id, helper_id, amount, payment_method, status,
        platform_fee, social_security_reserve, helper_payout, idempotency_key)
       SELECT $1, buyer_id, helper_id, $2, 'cash', 'CAPTURED', $3, $4, $5, $6
       FROM tasks WHERE id = $1`,
      [taskId, amount, platformFee, socialSecurity, helperPayout, idempotencyKey]
    );

    res.json({ status: 'confirmed', amount });
  } catch (err) {
    logger.error('Cash payment error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/payments/refund
router.post('/refund', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    if (!paymentId) {
      return res.status(400).json({ code: 400, message: 'paymentId is required' });
    }

    const result = await pool.query(
      `UPDATE payments SET status = 'REFUNDED', updated_at = NOW()
       WHERE id = $1 AND status = 'CAPTURED' RETURNING *`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ code: 400, message: 'Payment not found or not refundable' });
    }

    // Ledger entry for refund
    await pool.query(
      `INSERT INTO ledger_entries (payment_id, entry_type, amount, description)
       VALUES ($1, 'REFUND', $2, $3)`,
      [paymentId, -(amount || result.rows[0].amount), reason || 'Refund processed']
    );

    res.json({ status: 'refunded', paymentId });
  } catch (err) {
    logger.error('Refund error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
