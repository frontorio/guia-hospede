import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePropertyByCode } from '../api/properties';
import { ChatWidget } from '../components/ChatWidget';
import { Lightbox } from '../components/Lightbox';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback';
import { accessTypeLabel } from '../lib/accessTypes';
import { formatPhoneDisplay } from '../lib/phone';
import type {
  Amenities,
  EssentialItem,
  Guidebook,
  GuideItem,
  Operational,
} from '../api/types';

export function PropertyDetailPage() {
  const { code } = useParams();
  const { property, isLoading, isError, error } = usePropertyByCode(code);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (isLoading) return <Spinner label="Carregando imóvel..." />;
  if (isError) return <ErrorBanner message={(error as Error).message} />;
  if (!property)
    return (
      <EmptyState
        title="Imóvel não encontrado"
        description={`Nenhum imóvel com o código "${code}".`}
      />
    );

  const phone = formatPhoneDisplay(property.host.phone);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-brand-600 hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{property.name}</h1>
        <p className="text-sm text-slate-500">
          <span className="font-mono">{property.code}</span> ·{' '}
          {property.property_type} · {property.address.city}/
          {property.address.state}
        </p>
      </div>

      {property.images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto">
          {property.images.map((src, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className="shrink-0 overflow-hidden rounded-lg"
              aria-label={`Abrir foto ${i + 1} em tela cheia`}
            >
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="h-40 w-64 cursor-pointer object-cover transition hover:opacity-90"
              />
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard title="Capacidade">
          <Row label="Quartos" value={property.bedroom_quantity} />
          <Row label="Banheiros" value={property.bathroom_quantity} />
          <Row label="Hóspedes (máx.)" value={property.guest_capacity} />
        </InfoCard>

        <InfoCard title="Endereço">
          <p className="text-sm">
            {property.address.street}, {property.address.number}
            {property.address.complement
              ? ` — ${property.address.complement}`
              : ''}
          </p>
          <p className="text-sm text-slate-600">
            {property.address.neighborhood}, {property.address.city}/
            {property.address.state} · CEP {property.address.postal_code}
          </p>
        </InfoCard>

        <InfoCard title="Acesso e operacional">
          <OperationalRows operational={property.operational} />
        </InfoCard>

        <InfoCard title="Regras da estadia">
          <Row
            label="Check-in / out"
            value={`${property.rules.check_in_time} — ${property.rules.check_out_time}`}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Policy ok={property.rules.allow_pet} label="Pets" />
            <Policy ok={property.rules.smoking_permitted} label="Fumar" />
            <Policy ok={property.rules.events_permitted} label="Eventos" />
            <Policy
              ok={property.rules.suitable_for_children}
              label="Crianças"
            />
            <Policy ok={property.rules.suitable_for_babies} label="Bebês" />
          </div>
        </InfoCard>

        <InfoCard title="Amenidades">
          <AmenitiesList amenities={property.amenities} />
        </InfoCard>

        <InfoCard title="Anfitrião">
          <Row label="Nome" value={property.host.name} />
          <div className="flex justify-between gap-4 py-0.5 text-sm">
            <span className="text-slate-500">Telefone</span>
            {phone ? (
              <a
                href={phone.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-right font-medium text-brand-600 hover:underline"
                title="Abrir no WhatsApp"
              >
                {phone.flag} {phone.text} <span aria-hidden>💬</span>
              </a>
            ) : (
              <span className="text-right font-medium text-slate-800">—</span>
            )}
          </div>
        </InfoCard>
      </div>

      <GuidebookSection guidebook={property.guidebook} />

      <ChatWidget propertyId={property.id} propertyName={property.name} />

      {lightbox !== null && (
        <Lightbox
          images={property.images}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

/* ---------- Operacional: mostra todos os campos preenchidos ---------- */

function OperationalRows({ operational: o }: { operational: Operational }) {
  return (
    <>
      <OptionalRow label="Rede WiFi" value={o.wifi_network} />
      <OptionalRow label="Senha WiFi" value={o.wifi_password} />
      <Row
        label="Check-in autônomo"
        value={o.is_self_checkin ? 'Sim' : 'Não'}
      />
      <OptionalRow
        label="Tipo de acesso"
        value={accessTypeLabel(o.property_access_type)}
      />
      <OptionalRow
        label="Instruções de acesso"
        value={o.property_access_instructions}
      />
      <OptionalRow label="Senha do imóvel" value={o.property_password} />
      <Row
        label="Possui estacionamento"
        value={o.has_parking_spot ? 'Sim' : 'Não'}
      />
      <OptionalRow label="Vaga" value={o.parking_spot_identifier} />
      <OptionalRow
        label="Instruções de estacionamento"
        value={o.parking_spot_instructions}
      />
    </>
  );
}

/* ---------- Guidebook (somente leitura) ---------- */

function GuidebookSection({ guidebook }: { guidebook: Guidebook | null }) {
  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">✨ Guia de experiências (IA)</h2>
      </div>

      {!guidebook ? (
        <p className="text-sm text-slate-500">
          O guia é gerado automaticamente pela IA após o cadastro/edição do
          imóvel. Ainda não há um guia disponível.
        </p>
      ) : (
        <div className="space-y-6">
          <p className="rounded-lg bg-brand-50 p-4 text-sm text-slate-700">
            {guidebook.welcome_message}
          </p>

          <GuideList title="🍽️ Restaurantes" items={guidebook.restaurants} />
          <GuideList title="📍 Atrações" items={guidebook.attractions} />
          <EssentialsList items={guidebook.essentials} />

          {guidebook.seasonal_tips && (
            <div>
              <h3 className="mb-1 font-semibold">🗓️ Dica sazonal</h3>
              <p className="text-sm text-slate-600">
                {guidebook.seasonal_tips}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function GuideList({ title, items }: { title: string; items: GuideItem[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-slate-400">{item.distance}</span>
            </div>
            <p className="text-sm text-slate-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EssentialsList({ items }: { items: EssentialItem[] }) {
  if (!items?.length) return null;
  const typeLabels: Record<string, string> = {
    pharmacy: 'Farmácia',
    supermarket: 'Supermercado',
    hospital: 'Hospital',
  };
  return (
    <div>
      <h3 className="mb-2 font-semibold">🧭 Serviços essenciais</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">
                {item.name}{' '}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                  {typeLabels[item.type] ?? item.type}
                </span>
              </span>
              <span className="text-xs text-slate-400">{item.distance}</span>
            </div>
            <p className="text-sm text-slate-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Auxiliares ---------- */

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-0.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

/** Renderiza a linha apenas se o valor estiver preenchido. */
function OptionalRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value || value.trim() === '') return null;
  return <Row label={label} value={value} />;
}

function Policy({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {ok ? '✓' : '✕'} {label}
    </span>
  );
}

const AMENITY_LABELS: Record<keyof Amenities, string> = {
  wifi: 'WiFi',
  tv: 'TV',
  air_conditioning: 'Ar-condicionado',
  kitchen: 'Cozinha',
  washing_machine: 'Máq. de lavar',
  elevator: 'Elevador',
  balcony: 'Varanda',
  pool: 'Piscina',
  parking: 'Estacionamento',
  bbq_grill: 'Churrasqueira',
  dishwasher: 'Lava-louças',
};

function AmenitiesList({ amenities }: { amenities: Amenities }) {
  const active = (Object.keys(AMENITY_LABELS) as (keyof Amenities)[]).filter(
    (k) => amenities[k],
  );
  if (active.length === 0)
    return <p className="text-sm text-slate-400">Nenhuma amenidade marcada.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {active.map((k) => (
        <span
          key={k}
          className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
        >
          {AMENITY_LABELS[k]}
        </span>
      ))}
    </div>
  );
}
