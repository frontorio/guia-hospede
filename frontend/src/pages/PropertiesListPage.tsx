import { Link } from 'react-router-dom';
import { useProperties } from '../api/properties';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback';
import type { Property } from '../api/types';

export function PropertiesListPage() {
  const { data, isLoading, isError, error } = useProperties();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imóveis</h1>
          <p className="text-sm text-slate-500">
            Gerencie os imóveis de hospedagem e seus guias de experiências.
          </p>
        </div>
      </div>

      {isLoading && <Spinner label="Carregando imóveis..." />}
      {isError && <ErrorBanner message={(error as Error).message} />}

      {data && data.length === 0 && (
        <EmptyState
          title="Nenhum imóvel cadastrado"
          description="Clique em “+ Novo imóvel” para começar."
        />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to={`/properties/${property.code}`}
      className="card block p-5 transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {property.code}
          </span>
          <h2 className="mt-2 font-semibold leading-tight">{property.name}</h2>
          <p className="text-sm text-slate-500">
            {property.property_type} · {property.address.city}/
            {property.address.state}
          </p>
        </div>
        {property.guidebook && (
          <span
            className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
            title="Guia de experiências gerado"
          >
            ✨ Guia
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-4 text-sm text-slate-600">
        <span>🛏️ {property.bedroom_quantity}</span>
        <span>🚿 {property.bathroom_quantity}</span>
        <span>👥 {property.guest_capacity}</span>
      </div>
    </Link>
  );
}
