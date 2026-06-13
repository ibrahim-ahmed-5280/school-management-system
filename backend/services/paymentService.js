const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

const paymentError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const asPositiveAmount = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw paymentError('Amount must be greater than 0');
    }
    return Math.round(amount * 100) / 100;
};

const invoiceStatusExpression = (balanceExpression, paidAmountExpression) => ({
    $cond: [
        { $lte: [balanceExpression, 0] },
        'PAID',
        {
            $cond: [
                { $gt: [paidAmountExpression, 0] },
                'PARTIALLY_PAID',
                'UNPAID'
            ]
        }
    ]
});

const recordInvoicePayment = async ({
    tenantId,
    branchId,
    invoiceId,
    amount: rawAmount,
    method,
    reference,
    recordedBy
}) => {
    const amount = asPositiveAmount(rawAmount);
    if (!invoiceId || !method) throw paymentError('Invoice and payment method are required');

    const invoiceFilter = { _id: invoiceId, tenantId };
    if (branchId) invoiceFilter.branchId = branchId;

    const original = await Invoice.findOne(invoiceFilter);
    if (!original) throw paymentError('Invoice not found', 404);
    if (original.status === 'VOID') throw paymentError('Cannot pay a VOID invoice');
    if (original.balance < amount) throw paymentError(`Amount exceeds balance. Current balance: ${original.balance}`);

    const payment = await Payment.create({
        tenantId,
        branchId: original.branchId,
        invoiceId: original._id,
        amount,
        method,
        reference,
        recordedBy,
        status: 'PENDING'
    });

    const newPaidExpression = { $add: [{ $ifNull: ['$paidAmount', 0] }, amount] };
    const newBalanceExpression = { $subtract: [{ $ifNull: ['$balance', '$totalAmount'] }, amount] };

    const invoice = await Invoice.findOneAndUpdate(
        { ...invoiceFilter, status: { $ne: 'VOID' }, balance: { $gte: amount } },
        [{
            $set: {
                paidAmount: newPaidExpression,
                balance: newBalanceExpression,
                status: invoiceStatusExpression(newBalanceExpression, newPaidExpression)
            }
        }],
        { new: true }
    );

    if (!invoice) {
        await Payment.deleteOne({ _id: payment._id, status: 'PENDING' });
        throw paymentError('Payment could not be applied because the invoice balance changed. Refresh and try again.', 409);
    }

    try {
        payment.status = 'ACTIVE';
        await payment.save();
    } catch (error) {
        await Invoice.updateOne(
            { _id: invoice._id, tenantId, paidAmount: invoice.paidAmount, balance: invoice.balance },
            { $set: { paidAmount: original.paidAmount, balance: original.balance, status: original.status } }
        );
        await Payment.deleteOne({ _id: payment._id, status: 'PENDING' });
        throw error;
    }

    return { payment, invoice };
};

const reverseInvoicePayment = async ({
    tenantId,
    branchId,
    paymentId,
    reason,
    recordedBy
}) => {
    if (!reason || !String(reason).trim()) throw paymentError('Reason is required for reversal');

    const paymentFilter = { _id: paymentId, tenantId };
    if (branchId) paymentFilter.branchId = branchId;

    const payment = await Payment.findOneAndUpdate(
        {
            ...paymentFilter,
            amount: { $gt: 0 },
            status: { $in: ['ACTIVE', null] }
        },
        {
            $set: {
                status: 'REVERSED',
                reversedAt: new Date(),
                reversedBy: recordedBy,
                reversalReason: String(reason).trim()
            }
        },
        { new: false }
    );

    if (!payment) {
        const existing = await Payment.findOne(paymentFilter).select('status');
        if (!existing) throw paymentError('Payment not found', 404);
        throw paymentError('Payment has already been reversed or cannot be reversed', 409);
    }

    const invoiceFilter = { _id: payment.invoiceId, tenantId, status: { $ne: 'VOID' } };
    if (branchId) invoiceFilter.branchId = branchId;

    const originalInvoice = await Invoice.findOne(invoiceFilter);
    if (!originalInvoice || originalInvoice.paidAmount < payment.amount) {
        await Payment.updateOne(
            { _id: payment._id, status: 'REVERSED', reversedBy: recordedBy },
            { $set: { status: 'ACTIVE' }, $unset: { reversedAt: 1, reversedBy: 1, reversalReason: 1 } }
        );
        throw paymentError('Associated invoice could not be updated', 409);
    }

    const newPaidExpression = { $subtract: [{ $ifNull: ['$paidAmount', 0] }, payment.amount] };
    const newBalanceExpression = { $add: [{ $ifNull: ['$balance', 0] }, payment.amount] };
    const invoice = await Invoice.findOneAndUpdate(
        { ...invoiceFilter, paidAmount: { $gte: payment.amount } },
        [{
            $set: {
                paidAmount: newPaidExpression,
                balance: newBalanceExpression,
                status: invoiceStatusExpression(newBalanceExpression, newPaidExpression)
            }
        }],
        { new: true }
    );

    if (!invoice) {
        await Payment.updateOne(
            { _id: payment._id, status: 'REVERSED', reversedBy: recordedBy },
            { $set: { status: 'ACTIVE' }, $unset: { reversedAt: 1, reversedBy: 1, reversalReason: 1 } }
        );
        throw paymentError('Associated invoice could not be updated', 409);
    }

    try {
        const reversal = await Payment.create({
            tenantId,
            branchId: payment.branchId,
            invoiceId: payment.invoiceId,
            amount: -payment.amount,
            method: 'REVERSAL',
            reference: payment.reference,
            recordedBy,
            status: 'REVERSAL',
            reversalOf: payment._id,
            reversalReason: String(reason).trim()
        });
        return { payment, reversal, invoice };
    } catch (error) {
        await Invoice.updateOne(
            { _id: invoice._id, tenantId, paidAmount: invoice.paidAmount, balance: invoice.balance },
            {
                $set: {
                    paidAmount: originalInvoice.paidAmount,
                    balance: originalInvoice.balance,
                    status: originalInvoice.status
                }
            }
        );
        await Payment.updateOne(
            { _id: payment._id, status: 'REVERSED', reversedBy: recordedBy },
            { $set: { status: 'ACTIVE' }, $unset: { reversedAt: 1, reversedBy: 1, reversalReason: 1 } }
        );
        throw error;
    }
};

module.exports = { recordInvoicePayment, reverseInvoicePayment };
