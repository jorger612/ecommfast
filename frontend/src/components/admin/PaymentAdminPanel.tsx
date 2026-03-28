import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface PaymentProvider {
  id: string;
  name: 'stripe' | 'openpay' | 'paypal';
  is_enabled: boolean;
  apple_pay_enabled: boolean;
  google_pay_enabled: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  stripe:  'Stripe',
  openpay: 'OpenPay',
  paypal:  'PayPal',
};

export function PaymentAdminPanel() {
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin', 'payment-providers'],
    queryFn: () => api.get<{ data: PaymentProvider[] }>('/admin/payment-providers').then((r) => r.data.data),
  });

  const { mutate: updateProvider } = useMutation({
    mutationFn: ({ name, patch }: { name: string; patch: Partial<PaymentProvider> }) =>
      api.patch(`/admin/payment-providers/${name}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers'] }),
  });

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text mb-6">Administrador de Medios de Pago</h1>
      <div className="space-y-4">
        {providers.map((provider) => (
          <div key={provider.id} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text text-lg">{PROVIDER_LABELS[provider.name]}</h2>
              <Toggle
                label="Habilitado"
                value={provider.is_enabled}
                onChange={(v) => updateProvider({ name: provider.name, patch: { is_enabled: v } })}
              />
            </div>

            {provider.is_enabled && (
              <div className="flex gap-6 pl-2 border-l-2 border-surface">
                <Toggle
                  label="Apple Pay"
                  value={provider.apple_pay_enabled}
                  onChange={(v) => updateProvider({ name: provider.name, patch: { apple_pay_enabled: v } })}
                />
                <Toggle
                  label="Google Pay"
                  value={provider.google_pay_enabled}
                  onChange={(v) => updateProvider({ name: provider.name, patch: { google_pay_enabled: v } })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span className="text-sm text-text-muted">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
          ${value ? 'bg-primary' : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
            ${value ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </label>
  );
}
