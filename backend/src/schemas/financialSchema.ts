import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const paymentMethodEnum = z
  .enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'UNPAID', 'pix', 'dinheiro', 'debito', 'credito', 'transferencia', 'boleto', 'outros', 'unpaid'])
  .transform((val) => {
    const upper = val.toUpperCase();
    if (upper === 'DINHEIRO') return 'CASH';
    if (upper === 'DEBITO') return 'DEBIT_CARD';
    if (upper === 'CREDITO') return 'CREDIT_CARD';
    if (upper === 'TRANSFERENCIA' || upper === 'BOLETO') return 'PIX';
    return upper as any;
  });

const receivableStatusEnum = z
  .enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID', 'pending', 'paid', 'overdue', 'cancelled', 'partially_paid'])
  .transform((val) => val.toUpperCase() as any);

const payableStatusEnum = z
  .enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'pending', 'paid', 'overdue', 'cancelled'])
  .transform((val) => val.toUpperCase() as any);

const payableCategoryEnum = z
  .enum([
    'ALUGUEL', 'SALARIOS', 'COMISSOES', 'FORNECEDORES', 'MARKETING', 'INTERNET', 'ENERGIA', 'IMPOSTOS', 'MATERIAIS', 'FUNCIONARIOS', 'OUTROS',
    'aluguel', 'salarios', 'comissoes', 'fornecedores', 'marketing', 'internet', 'energia', 'impostos', 'materiais', 'funcionarios', 'outros'
  ])
  .transform((val) => val.toUpperCase() as any);

export const createReceivableSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Nome do cliente é obrigatório'),
    customerPhone: z.string().optional().nullable(),
    customerId: z.string().uuid().optional().nullable(),
    appointmentId: z.string().uuid().optional().nullable(),
    serviceName: z.string().optional().nullable(),
    professionalName: z.string().optional().nullable(),
    description: z.string().min(2, 'Descrição é obrigatória'),
    originalAmount: z.number().min(0, 'Valor não pode ser negativo'),
    discount: z.number().min(0).optional().default(0),
    surcharge: z.number().min(0).optional().default(0),
    finalAmount: z.number().min(0).optional(),
    amountPaid: z.number().min(0).optional().default(0),
    paymentMethod: paymentMethodEnum.optional().default('PIX'),
    dueDate: z.string().regex(dateRegex, 'Data de vencimento inválida (AAAA-MM-DD)'),
    paidAt: z.string().regex(dateRegex).optional().nullable(),
    status: receivableStatusEnum.optional().default('PENDING'),
    hasSignal: z.boolean().optional().default(false),
    signalAmount: z.number().min(0).optional().nullable(),
    signalPaid: z.boolean().optional().default(false),
    notes: z.string().optional().nullable(),
  }),
});

export const updateReceivableSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    customerName: z.string().min(2).optional(),
    customerPhone: z.string().optional().nullable(),
    description: z.string().min(2).optional(),
    originalAmount: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    surcharge: z.number().min(0).optional(),
    finalAmount: z.number().min(0).optional(),
    amountPaid: z.number().min(0).optional(),
    paymentMethod: paymentMethodEnum.optional(),
    dueDate: z.string().regex(dateRegex).optional(),
    paidAt: z.string().regex(dateRegex).optional().nullable(),
    status: receivableStatusEnum.optional(),
    hasSignal: z.boolean().optional(),
    signalAmount: z.number().min(0).optional().nullable(),
    signalPaid: z.boolean().optional(),
    notes: z.string().optional().nullable(),
  }),
});

export const createPayableSchema = z.object({
  body: z.object({
    description: z.string().min(2, 'Descrição é obrigatória'),
    category: payableCategoryEnum.optional().default('OUTROS'),
    amount: z.number().min(0, 'Valor deve ser positivo'),
    paidAmount: z.number().min(0).optional().default(0),
    dueDate: z.string().regex(dateRegex, 'Data de vencimento inválida'),
    paidAt: z.string().regex(dateRegex).optional().nullable(),
    status: payableStatusEnum.optional().default('PENDING'),
    supplierId: z.string().uuid().optional().nullable(),
    supplierName: z.string().optional().nullable(),
    professionalId: z.string().uuid().optional().nullable(),
    professionalName: z.string().optional().nullable(),
    paymentMethod: paymentMethodEnum.optional().nullable(),
    isRecurring: z.boolean().optional().default(false),
    recurrenceType: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updatePayableSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    description: z.string().min(2).optional(),
    category: payableCategoryEnum.optional(),
    amount: z.number().min(0).optional(),
    paidAmount: z.number().min(0).optional(),
    dueDate: z.string().regex(dateRegex).optional(),
    paidAt: z.string().regex(dateRegex).optional().nullable(),
    status: payableStatusEnum.optional(),
    supplierId: z.string().uuid().optional().nullable(),
    supplierName: z.string().optional().nullable(),
    professionalId: z.string().uuid().optional().nullable(),
    professionalName: z.string().optional().nullable(),
    paymentMethod: paymentMethodEnum.optional().nullable(),
    isRecurring: z.boolean().optional(),
    recurrenceType: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Razão Social ou Nome é obrigatório'),
    tradeName: z.string().optional().nullable(),
    document: z.string().min(11, 'CPF ou CNPJ inválido'),
    phone: z.string().min(8, 'Telefone inválido'),
    email: z.string().email('E-mail inválido').optional().nullable(),
    address: z.string().optional().nullable(),
    carrierName: z.string().optional().nullable(),
    category: z.string().optional().default('Geral'),
    notes: z.string().optional().nullable(),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    tradeName: z.string().optional().nullable(),
    document: z.string().min(11).optional(),
    phone: z.string().min(8).optional(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    carrierName: z.string().optional().nullable(),
    category: z.string().optional(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const createMerchandiseSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome do produto é obrigatório'),
    supplierId: z.string().uuid().optional().nullable(),
    supplierName: z.string().optional().nullable(),
    carrierName: z.string().optional().nullable(),
    quantity: z.number().int().min(0).optional().default(0),
    minQuantity: z.number().int().min(0).optional().default(5),
    unit: z.string().optional().default('un'),
    costPrice: z.number().min(0, 'Preço de custo inválido'),
    salePrice: z.number().min(0).optional().nullable(),
    lastRestockDate: z.string().regex(dateRegex).optional().nullable(),
  }),
});

export const updateMerchandiseSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    supplierId: z.string().uuid().optional().nullable(),
    supplierName: z.string().optional().nullable(),
    carrierName: z.string().optional().nullable(),
    quantity: z.number().int().min(0).optional(),
    minQuantity: z.number().int().min(0).optional(),
    unit: z.string().optional(),
    costPrice: z.number().min(0).optional(),
    salePrice: z.number().min(0).optional().nullable(),
    lastRestockDate: z.string().regex(dateRegex).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const adjustStockSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    type: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT', 'entry', 'exit', 'adjustment']).transform((val) => val.toUpperCase() as 'ENTRY' | 'EXIT' | 'ADJUSTMENT'),
    quantityDelta: z.number().int(),
    reason: z.string().optional().nullable(),
  }),
});

export const depositConfigSchema = z.object({
  body: z.object({
    enabled: z.boolean(),
    type: z.enum(['percentage', 'fixed']).default('percentage'),
    value: z.number().min(0, 'Valor não pode ser negativo'),
  }),
});

export const financialIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

