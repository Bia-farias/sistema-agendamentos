import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';

export const financialService = {
  // --------------------------------------------------------------------------
  // RECEIVABLES (CONTAS A RECEBER)
  // --------------------------------------------------------------------------

  async listReceivables(tenantId: string, query?: { status?: string; startDate?: string; endDate?: string }) {
    const where: any = { tenantId };
    if (query?.status) where.status = query.status.toUpperCase();
    if (query?.startDate && query?.endDate) {
      where.dueDate = { gte: query.startDate, lte: query.endDate };
    }

    const receivables = await prisma.receivable.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    return receivables.map((r) => ({
      ...r,
      originalAmount: Number(r.originalAmount),
      discount: Number(r.discount),
      surcharge: Number(r.surcharge),
      finalAmount: Number(r.finalAmount),
      amountPaid: Number(r.amountPaid),
      signalAmount: r.signalAmount ? Number(r.signalAmount) : null,
    }));
  },

  async createReceivable(tenantId: string, data: any) {
    const finalAmount =
      data.finalAmount !== undefined
        ? data.finalAmount
        : data.originalAmount - (data.discount || 0) + (data.surcharge || 0);

    const receivable = await prisma.receivable.create({
      data: {
        tenantId,
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        clientId: data.customerId || null,
        appointmentId: data.appointmentId || null,
        serviceName: data.serviceName || null,
        professionalName: data.professionalName || null,
        description: data.description,
        originalAmount: data.originalAmount,
        discount: data.discount || 0,
        surcharge: data.surcharge || 0,
        finalAmount,
        amountPaid: data.amountPaid || 0,
        paymentMethod: data.paymentMethod || 'PIX',
        dueDate: data.dueDate,
        paidAt: data.paidAt || null,
        status: data.status || 'PENDING',
        hasSignal: Boolean(data.hasSignal),
        signalAmount: data.signalAmount || null,
        signalPaid: Boolean(data.signalPaid),
        notes: data.notes || null,
      },
    });

    return {
      ...receivable,
      originalAmount: Number(receivable.originalAmount),
      discount: Number(receivable.discount),
      surcharge: Number(receivable.surcharge),
      finalAmount: Number(receivable.finalAmount),
      amountPaid: Number(receivable.amountPaid),
      signalAmount: receivable.signalAmount ? Number(receivable.signalAmount) : null,
    };
  },

  async updateReceivable(id: string, tenantId: string, data: any) {
    const existing = await prisma.receivable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    const updated = await prisma.receivable.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      originalAmount: Number(updated.originalAmount),
      discount: Number(updated.discount),
      surcharge: Number(updated.surcharge),
      finalAmount: Number(updated.finalAmount),
      amountPaid: Number(updated.amountPaid),
      signalAmount: updated.signalAmount ? Number(updated.signalAmount) : null,
    };
  },

  async markReceivablePaid(id: string, tenantId: string, paymentMethod?: string, paidAt?: string) {
    const existing = await prisma.receivable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    const updated = await prisma.receivable.update({
      where: { id },
      data: {
        status: 'PAID',
        amountPaid: existing.finalAmount,
        paidAt: paidAt || new Date().toISOString().split('T')[0],
        ...(paymentMethod ? { paymentMethod: paymentMethod.toUpperCase() as any } : {}),
      },
    });

    return {
      ...updated,
      originalAmount: Number(updated.originalAmount),
      finalAmount: Number(updated.finalAmount),
      amountPaid: Number(updated.amountPaid),
    };
  },

  async deleteReceivable(id: string, tenantId: string) {
    const existing = await prisma.receivable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    await prisma.receivable.delete({
      where: { id },
    });

    return { message: 'Conta a receber removida com sucesso' };
  },

  // --------------------------------------------------------------------------
  // PAYABLES (CONTAS A PAGAR)
  // --------------------------------------------------------------------------

  async listPayables(tenantId: string, query?: { status?: string; category?: string }) {
    const where: any = { tenantId };
    if (query?.status) where.status = query.status.toUpperCase();
    if (query?.category) where.category = query.category.toUpperCase();

    const payables = await prisma.payable.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    return payables.map((p) => ({
      ...p,
      amount: Number(p.amount),
      paidAmount: Number(p.paidAmount),
    }));
  },

  async createPayable(tenantId: string, data: any) {
    const payable = await prisma.payable.create({
      data: {
        tenantId,
        description: data.description,
        category: data.category || 'OUTROS',
        amount: data.amount,
        paidAmount: data.paidAmount || 0,
        dueDate: data.dueDate,
        paidAt: data.paidAt || null,
        status: data.status || 'PENDING',
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || null,
        professionalId: data.professionalId || null,
        professionalName: data.professionalName || null,
        paymentMethod: data.paymentMethod || null,
        isRecurring: Boolean(data.isRecurring),
        recurrenceType: data.recurrenceType || null,
        notes: data.notes || null,
      },
    });

    return {
      ...payable,
      amount: Number(payable.amount),
      paidAmount: Number(payable.paidAmount),
    };
  },

  async updatePayable(id: string, tenantId: string, data: any) {
    const existing = await prisma.payable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Despesa não encontrada', 404);
    }

    const updated = await prisma.payable.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      amount: Number(updated.amount),
      paidAmount: Number(updated.paidAmount),
    };
  },

  async markPayablePaid(id: string, tenantId: string, paidAmount?: number, paymentMethod?: string, paidAt?: string) {
    const existing = await prisma.payable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Despesa não encontrada', 404);
    }

    const amountToPay = paidAmount !== undefined ? paidAmount : Number(existing.amount);

    const updated = await prisma.payable.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAmount: amountToPay,
        paidAt: paidAt || new Date().toISOString().split('T')[0],
        ...(paymentMethod ? { paymentMethod: paymentMethod.toUpperCase() as any } : {}),
      },
    });

    return {
      ...updated,
      amount: Number(updated.amount),
      paidAmount: Number(updated.paidAmount),
    };
  },

  async deletePayable(id: string, tenantId: string) {
    const existing = await prisma.payable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Despesa não encontrada', 404);
    }

    await prisma.payable.delete({
      where: { id },
    });

    return { message: 'Despesa removida com sucesso' };
  },

  // --------------------------------------------------------------------------
  // SUPPLIERS (FORNECEDORES)
  // --------------------------------------------------------------------------

  async listSuppliers(tenantId: string) {
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { payables: true, merchandises: true },
        },
      },
    });

    return suppliers;
  },

  async createSupplier(tenantId: string, data: any) {
    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: data.name,
        tradeName: data.tradeName || null,
        document: data.document,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        carrierName: data.carrierName || null,
        category: data.category || 'Geral',
        notes: data.notes || null,
        isActive: true,
      },
    });

    return supplier;
  },

  async updateSupplier(id: string, tenantId: string, data: any) {
    const existing = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Fornecedor não encontrado', 404);
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data,
    });

    return updated;
  },

  async deleteSupplier(id: string, tenantId: string) {
    const existing = await prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { payables: true, merchandises: true } },
      },
    });

    if (!existing) {
      throw new AppError('Fornecedor não encontrado', 404);
    }

    // Se possui lançamentos financeiros ou produtos, faz soft-delete
    if (existing._count.payables > 0 || existing._count.merchandises > 0) {
      await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Fornecedor desativado com sucesso (histórico preservado)', deactivated: true };
    }

    await prisma.supplier.delete({ where: { id } });
    return { message: 'Fornecedor removido com sucesso', deactivated: false };
  },

  // --------------------------------------------------------------------------
  // MERCHANDISE & ESTOQUE (PRODUTOS)
  // --------------------------------------------------------------------------

  async listMerchandise(tenantId: string) {
    const items = await prisma.merchandise.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return items.map((m) => ({
      ...m,
      costPrice: Number(m.costPrice),
      salePrice: m.salePrice ? Number(m.salePrice) : null,
      totalCost: Number(m.totalCost),
    }));
  },

  async createMerchandise(tenantId: string, data: any) {
    const totalCost = Number(data.costPrice) * Number(data.quantity || 0);

    const item = await prisma.merchandise.create({
      data: {
        tenantId,
        name: data.name,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || null,
        carrierName: data.carrierName || null,
        quantity: data.quantity || 0,
        minQuantity: data.minQuantity !== undefined ? data.minQuantity : 5,
        unit: data.unit || 'un',
        costPrice: data.costPrice,
        salePrice: data.salePrice || null,
        totalCost,
        lastRestockDate: data.lastRestockDate || new Date().toISOString().split('T')[0],
        isActive: true,
      },
    });

    return {
      ...item,
      costPrice: Number(item.costPrice),
      salePrice: item.salePrice ? Number(item.salePrice) : null,
      totalCost: Number(item.totalCost),
    };
  },

  async adjustStock(id: string, tenantId: string, type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT', delta: number, reason?: string) {
    const item = await prisma.merchandise.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new AppError('Produto não encontrado', 404);
    }

    const previousQty = item.quantity;
    let newQty = previousQty;

    if (type === 'ENTRY') {
      newQty = previousQty + Math.abs(delta);
    } else if (type === 'EXIT') {
      newQty = Math.max(0, previousQty - Math.abs(delta));
    } else {
      newQty = Math.max(0, delta);
    }

    const newTotalCost = Number(item.costPrice) * newQty;

    const [updated] = await prisma.$transaction([
      prisma.merchandise.update({
        where: { id },
        data: {
          quantity: newQty,
          totalCost: newTotalCost,
          ...(type === 'ENTRY' ? { lastRestockDate: new Date().toISOString().split('T')[0] } : {}),
        },
      }),
      prisma.stockMovement.create({
        data: {
          tenantId,
          merchandiseId: id,
          type,
          quantityDelta: delta,
          previousQty,
          newQty,
          reason: reason || null,
        },
      }),
    ]);

    return {
      ...updated,
      costPrice: Number(updated.costPrice),
      salePrice: updated.salePrice ? Number(updated.salePrice) : null,
      totalCost: Number(updated.totalCost),
    };
  },

  async deleteMerchandise(id: string, tenantId: string) {
    const existing = await prisma.merchandise.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Produto não encontrado', 404);
    }

    await prisma.merchandise.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Produto desativado com sucesso' };
  },

  // --------------------------------------------------------------------------
  // DEPOSIT CONFIG (CONFIGURAÇÃO DE SINAL PIX)
  // --------------------------------------------------------------------------

  async getDepositConfig(tenantId: string) {
    const config = await prisma.depositConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return {
        enabled: false,
        type: 'percentage',
        value: 30,
      };
    }

    return {
      enabled: config.enabled,
      type: config.type,
      value: Number(config.value),
    };
  },

  async updateDepositConfig(tenantId: string, data: { enabled: boolean; type?: string; value: number }) {
    const config = await prisma.depositConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        enabled: data.enabled,
        type: data.type || 'percentage',
        value: data.value,
      },
      update: {
        enabled: data.enabled,
        type: data.type || 'percentage',
        value: data.value,
      },
    });

    return {
      enabled: config.enabled,
      type: config.type,
      value: Number(config.value),
    };
  },
};

