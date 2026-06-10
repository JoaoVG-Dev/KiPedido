import {
  BadgeDollarSign,
  CreditCard,
  Percent,
  Printer,
  ReceiptText,
  RefreshCw,
  Unlock,
  Utensils,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BillSummaryCard } from "../../components/cashier/BillSummaryCard";
import { TableStatusCard } from "../../components/cashier/TableStatusCard";
import {
  cashierTableStatusLabel,
  cashierTableStatusTone,
} from "../../components/cashier/tableStatusMeta";
import { MetricCard } from "../../components/shared/MetricCard";
import { PageHeader } from "../../components/shared/PageHeader";
import {
  ApiStateMessage,
  StateMessage,
} from "../../components/shared/StateMessage";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiQuery } from "../../hooks/useApiQuery";
import { usePageTitle } from "../../hooks/usePageTitle";
import { apiGet, apiPost } from "../../services/api";
import { formatCurrency, formatDateTime } from "../../services/format";
import { printArea } from "../../services/print";
import type {
  ApiOrder,
  ApiPayment,
  ApiRestaurantTable,
  StatusTone,
  TableBillResponse,
} from "../../types";

type PaymentMethod = "cash" | "credit_card" | "debit_card" | "pix";

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
];

export function CashierDashboard() {
  usePageTitle("Caixa");
  const query = useApiQuery(
    () => apiGet<ApiRestaurantTable[]>("/cashier/tables"),
    [],
  );
  const tables = query.data ?? [];
  const openTables = tables.filter((table) =>
    ["occupied", "waiting_payment"].includes(table.status),
  );
  const waitingPayment = tables.filter(
    (table) => table.status === "waiting_payment",
  );
  const amountToReceive = openTables.reduce(
    (sum, table) => sum + Number(table.active_session?.total_amount ?? 0),
    0,
  );

  return (
    <section className="page-stack cashier-page">
      <PageHeader
        eyebrow="Caixa"
        title="Fechamento de mesas"
        description="Acompanhe consumo aberto, mesas aguardando pagamento e liberação para o salão."
        actions={
          <button
            className="secondary-button"
            type="button"
            onClick={() => void query.reload()}
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        }
      />

      <div className="metrics-grid">
        <MetricCard
          icon={Utensils}
          label="Mesas abertas"
          value={String(openTables.length)}
          detail={`${waitingPayment.length} pediu conta`}
          tone="info"
        />
        <MetricCard
          icon={BadgeDollarSign}
          label="A receber"
          value={formatCurrency(amountToReceive)}
          detail="consumo aberto"
          tone="warning"
        />
        <MetricCard
          icon={CreditCard}
          label="Mesas livres"
          value={String(
            tables.filter((table) => table.status === "available").length,
          )}
          detail="disponíveis agora"
          tone="success"
        />
      </div>

      <CashierTablesPanel query={query} />
    </section>
  );
}

export function CashierTablesPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  usePageTitle("Mesas do caixa");
  const query = useApiQuery(
    () => apiGet<ApiRestaurantTable[]>("/cashier/tables"),
    [],
  );

  return (
    <section
      className={
        embedded ? "panel cashier-page-panel" : "page-stack cashier-page"
      }
    >
      {!embedded ? (
        <PageHeader
          eyebrow="Mesas"
          title="Consumo por mesa"
          description="Veja status, total atual e abra o fechamento de qualquer mesa."
          actions={
            <button
              className="secondary-button"
              type="button"
              onClick={() => void query.reload()}
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          }
        />
      ) : null}
      <CashierTablesPanel query={query} />
    </section>
  );
}

type CashierTablesQuery = {
  data: ApiRestaurantTable[] | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
};

function CashierTablesPanel({ query }: { query: CashierTablesQuery }) {
  const tables = query.data ?? [];

  if (query.isLoading) {
    return <StateMessage title="Carregando mesas do caixa..." tone="loading" />;
  }

  if (query.error) {
    return <ApiStateMessage error={query.error} />;
  }

  if (tables.length === 0) {
    return <StateMessage title="Nenhuma mesa cadastrada." />;
  }

  return (
    <div className="cashier-grid">
      {tables.map((table) => (
        <TableStatusCard table={table} key={table.id} />
      ))}
    </div>
  );
}

export function CashierTableDetailPage() {
  usePageTitle("Detalhe da mesa");
  const { id = "1" } = useParams();
  const tableQuery = useApiQuery(
    () => apiGet<ApiRestaurantTable[]>("/cashier/tables"),
    [],
  );
  const billQuery = useApiQuery(
    () => apiGet<TableBillResponse>(`/cashier/tables/${id}/bill`),
    [id],
  );
  const table = tableQuery.data?.find((item) => String(item.id) === id);
  const orders = billQuery.data?.session.orders ?? [];
  const registeredPayments = billQuery.data?.session.payments ?? [];
  const printId = `cashier-table-${id}`;

  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [amountPaid, setAmountPaid] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<string | null>(null);

  const totalAmount = Number(billQuery.data?.total_amount ?? 0);
  const paidAmount = Number(billQuery.data?.paid_amount ?? 0);
  const remainingAmount = Number(
    billQuery.data?.remaining_amount ?? totalAmount,
  );
  const amountPaidValue = amountPaid ?? String(remainingAmount || totalAmount);
  const parsedAmountPaid = Number(amountPaidValue || 0);
  const projectedPaidAmount = paidAmount + parsedAmountPaid;
  const projectedRemainingAmount = Math.max(
    totalAmount - projectedPaidAmount,
    0,
  );
  const projectedChangeAmount = Math.max(projectedPaidAmount - totalAmount, 0);
  const isAmountInvalid = Boolean(amountPaidValue) && parsedAmountPaid <= 0;

  const currentDiscountAmount = Number(billQuery.data?.discount_amount ?? 0);
  const maxDiscountAmount = Math.max(
    Number(billQuery.data?.subtotal ?? 0) +
      Number(billQuery.data?.service_fee_amount ?? 0),
    0,
  );
  const discountAmountValue =
    discountAmount ??
    (currentDiscountAmount > 0 ? String(currentDiscountAmount) : "");
  const parsedDiscountAmount = Number(discountAmountValue || 0);
  const isDiscountInvalid =
    Boolean(discountAmountValue) &&
    (parsedDiscountAmount < 0 || parsedDiscountAmount > maxDiscountAmount);

  const selectedPaymentLabel = useMemo(() => {
    return (
      paymentMethodOptions.find((option) => option.value === paymentMethod)
        ?.label ?? "PIX"
    );
  }, [paymentMethod]);

  async function closeTable() {
    setSuccess(null);
    setActionError(null);

    if (!billQuery.data) {
      setActionError("Carregue a conta antes de registrar o pagamento.");
      return;
    }

    if (parsedAmountPaid <= 0) {
      setActionError("Informe um valor recebido maior que zero.");
      return;
    }

    try {
      const closesBill = paidAmount + parsedAmountPaid >= totalAmount;

      await apiPost<ApiPayment>(`/cashier/tables/${id}/close`, {
        payment_method: paymentMethod,
        amount_paid: parsedAmountPaid,
      });

      setSuccess(
        closesBill
          ? `Pagamento registrado via ${selectedPaymentLabel} e conta finalizada.`
          : `Pagamento registrado via ${selectedPaymentLabel}. Ainda faltam ${formatCurrency(
              Math.max(totalAmount - (paidAmount + parsedAmountPaid), 0),
            )}.`,
      );
      setAmountPaid(null);
      await tableQuery.reload();
      await billQuery.reload().catch(() => undefined);
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Erro ao registrar pagamento.",
      );
    }
  }

  async function applyDiscount() {
    setSuccess(null);
    setActionError(null);

    if (!billQuery.data) {
      setActionError("Carregue a conta antes de aplicar desconto.");
      return;
    }

    if (parsedDiscountAmount < 0) {
      setActionError("O desconto não pode ser negativo.");
      return;
    }

    if (parsedDiscountAmount > maxDiscountAmount) {
      setActionError(
        `O desconto não pode ser maior que ${formatCurrency(maxDiscountAmount)}.`,
      );
      return;
    }

    try {
      await apiPost<TableBillResponse>(`/cashier/tables/${id}/apply-discount`, {
        discount_amount: parsedDiscountAmount,
      });

      setSuccess(
        parsedDiscountAmount > 0
          ? `Desconto de ${formatCurrency(parsedDiscountAmount)} aplicado.`
          : "Desconto removido da conta.",
      );
      setDiscountAmount(null);
      setAmountPaid(null);
      await tableQuery.reload();
      await billQuery.reload();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Erro ao aplicar desconto.",
      );
    }
  }

  async function releaseTable() {
    setSuccess(null);
    setActionError(null);

    try {
      await apiPost<ApiRestaurantTable>(`/cashier/tables/${id}/release`);
      setSuccess("Mesa liberada com sucesso.");
      await tableQuery.reload();
      await billQuery.reload().catch(() => undefined);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Erro ao liberar mesa.",
      );
    }
  }

  return (
    <section
      className="page-stack cashier-page printable-area"
      data-print-id={printId}
    >
      <PageHeader
        eyebrow="Fechamento"
        title={table?.name ?? `Mesa ${id}`}
        description="Confira o recibo, registre pagamentos parciais e finalize a conta."
        actions={
          table ? (
            <StatusBadge
              label={cashierTableStatusLabel[table.status]}
              tone={cashierTableStatusTone[table.status]}
            />
          ) : null
        }
      />

      {tableQuery.isLoading ? (
        <StateMessage title="Carregando mesa..." tone="loading" />
      ) : null}
      {tableQuery.error ? <ApiStateMessage error={tableQuery.error} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <div className="cashier-detail-grid">
        <BillSummaryCard
          bill={billQuery.data}
          isLoading={billQuery.isLoading}
          error={billQuery.error}
        />

        <section className="panel cashier-actions no-print">
          <span className="eyebrow">Ações do caixa</span>
          <h2>Registrar pagamento</h2>

          <div className="cashier-payment-form">
            <div className="cashier-payment-header">
              <div>
                <span className="eyebrow">Pagamento</span>
                <strong>Como o cliente vai pagar?</strong>
              </div>
              <span>{selectedPaymentLabel}</span>
            </div>

            <div className="cashier-payment-method-grid">
              {paymentMethodOptions.map((option) => (
                <button
                  className={
                    option.value === paymentMethod
                      ? "cashier-payment-method is-active"
                      : "cashier-payment-method"
                  }
                  type="button"
                  key={option.value}
                  onClick={() => setPaymentMethod(option.value)}
                >
                  <span>{option.label}</span>
                  {option.value === paymentMethod ? (
                    <small>Selecionado</small>
                  ) : (
                    <small>Selecionar</small>
                  )}
                </button>
              ))}
            </div>

            <label className="cashier-amount-field">
              <span>Valor recebido</span>
              <div
                className={
                  isAmountInvalid
                    ? "cashier-amount-input has-error"
                    : "cashier-amount-input"
                }
              >
                <small>R$</small>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaidValue}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  placeholder="0,00"
                />
              </div>
            </label>

            <div className="cashier-quick-amounts">
              <button
                type="button"
                onClick={() => setAmountPaid(String(remainingAmount))}
              >
                Valor restante
              </button>
              <button
                type="button"
                onClick={() =>
                  setAmountPaid(String(Math.max(remainingAmount / 2, 0)))
                }
              >
                Dividir por 2
              </button>
              <button
                type="button"
                onClick={() =>
                  setAmountPaid(String(Math.max(remainingAmount / 3, 0)))
                }
              >
                Dividir por 3
              </button>
              <button
                type="button"
                onClick={() => setAmountPaid(String(remainingAmount + 10))}
              >
                + R$ 10
              </button>
            </div>

            <div className="cashier-payment-summary">
              <div>
                <span>Total da conta</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>

              <div>
                <span>Já pago</span>
                <strong>{formatCurrency(paidAmount)}</strong>
              </div>

              <div>
                <span>Recebendo agora</span>
                <strong>{formatCurrency(parsedAmountPaid)}</strong>
              </div>

              <div className="cashier-payment-summary__total">
                <span>
                  {projectedRemainingAmount > 0
                    ? "Restante após pagamento"
                    : "Troco"}
                </span>
                <strong>
                  {formatCurrency(
                    projectedRemainingAmount > 0
                      ? projectedRemainingAmount
                      : projectedChangeAmount,
                  )}
                </strong>
              </div>
            </div>

            {isAmountInvalid ? (
              <small className="cashier-payment-error">
                Informe um valor recebido maior que zero.
              </small>
            ) : null}
          </div>

          {registeredPayments.length > 0 ? (
            <div className="cashier-payment-history">
              <div className="cashier-payment-history__header">
                <span>Pagamentos registrados</span>
                <strong>{formatCurrency(paidAmount)}</strong>
              </div>

              {registeredPayments.map((payment) => (
                <div className="cashier-payment-history__item" key={payment.id}>
                  <span>{paymentMethodLabel(payment.payment_method)}</span>
                  <strong>{formatCurrency(payment.amount_paid)}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className="cashier-payment-form">
            <div className="cashier-payment-header">
              <div>
                <span className="eyebrow">Desconto</span>
                <strong>Aplicar desconto na conta</strong>
              </div>
              <span>{formatCurrency(currentDiscountAmount)}</span>
            </div>

            <label className="cashier-amount-field">
              <span>Valor do desconto</span>
              <div
                className={
                  isDiscountInvalid
                    ? "cashier-amount-input has-error"
                    : "cashier-amount-input"
                }
              >
                <small>R$</small>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmountValue}
                  onChange={(event) => setDiscountAmount(event.target.value)}
                  placeholder="0,00"
                  disabled={!billQuery.data}
                />
              </div>
            </label>

            <div className="cashier-quick-amounts">
              <button type="button" onClick={() => setDiscountAmount("0")}>
                Remover
              </button>
              <button type="button" onClick={() => setDiscountAmount("5")}>
                R$ 5
              </button>
              <button type="button" onClick={() => setDiscountAmount("10")}>
                R$ 10
              </button>
              <button type="button" onClick={() => setDiscountAmount("20")}>
                R$ 20
              </button>
            </div>

            <div className="cashier-payment-summary">
              <div>
                <span>Subtotal + taxa</span>
                <strong>{formatCurrency(maxDiscountAmount)}</strong>
              </div>

              <div>
                <span>Desconto atual</span>
                <strong>{formatCurrency(currentDiscountAmount)}</strong>
              </div>

              <div className="cashier-payment-summary__total">
                <span>Novo desconto</span>
                <strong>{formatCurrency(parsedDiscountAmount)}</strong>
              </div>
            </div>

            {isDiscountInvalid ? (
              <small className="cashier-payment-error">
                O desconto não pode ser maior que{" "}
                {formatCurrency(maxDiscountAmount)}.
              </small>
            ) : null}

            <button
              className="secondary-button"
              type="button"
              disabled={!billQuery.data || isDiscountInvalid}
              onClick={() => void applyDiscount()}
            >
              <Percent size={18} />
              Aplicar desconto
            </button>
          </div>

          <button
            className="secondary-button no-print"
            type="button"
            disabled={!billQuery.data}
            onClick={() => printArea(printId, "cashier")}
          >
            <Printer size={18} />
            Imprimir recibo
          </button>

          <button
            className="primary-button"
            type="button"
            disabled={!billQuery.data || isAmountInvalid}
            onClick={() => void closeTable()}
          >
            <ReceiptText size={18} />
            Registrar pagamento via {selectedPaymentLabel}
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => void releaseTable()}
          >
            <Unlock size={18} />
            Liberar mesa
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void tableQuery.reload();
              void billQuery.reload();
            }}
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </section>
      </div>

      <section className="panel cashier-orders-panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Consumo</span>
            <h2>Pedidos da sessão</h2>
          </div>
          <span>
            {orders.length} pedido{orders.length === 1 ? "" : "s"}
          </span>
        </div>
        {orders.length === 0 ? (
          <StateMessage title="Nenhum pedido ativo para esta mesa." />
        ) : (
          <OrderList orders={orders} />
        )}
      </section>
    </section>
  );
}

function OrderList({ orders }: { orders: ApiOrder[] }) {
  return (
    <div className="cashier-order-list">
      {orders.map((order) => (
        <article className="cashier-order-card" key={order.id}>
          <div className="cashier-order-card__header">
            <div>
              <strong>{order.code}</strong>
              <small>
                {order.sent_at
                  ? formatDateTime(order.sent_at)
                  : "Horário em processamento"}
              </small>
            </div>
            <StatusBadge
              label={orderStatusLabel(order.status)}
              tone={orderStatusTone(order.status)}
            />
          </div>
          <div className="cashier-order-items">
            {(order.items ?? []).map((item) => (
              <div key={item.id}>
                <span>
                  <strong>
                    {item.quantity}x {item.product_name}
                  </strong>
                  {item.notes ? <small>{item.notes}</small> : null}
                </span>
                <strong>{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function paymentMethodLabel(method: ApiPayment["payment_method"]) {
  return {
    cash: "Dinheiro",
    credit_card: "Cartão de crédito",
    debit_card: "Cartão de débito",
    pix: "PIX",
    mixed: "Misto",
  }[method];
}

function orderStatusLabel(status: ApiOrder["status"]) {
  return {
    received: "Recebido",
    preparing: "Em preparo",
    ready: "Pronto",
    delivered: "Entregue",
    cancelled: "Cancelado",
  }[status];
}

function orderStatusTone(status: ApiOrder["status"]): StatusTone {
  const tones: Record<ApiOrder["status"], StatusTone> = {
    received: "warning",
    preparing: "info",
    ready: "success",
    delivered: "neutral",
    cancelled: "danger",
  };

  return tones[status];
}