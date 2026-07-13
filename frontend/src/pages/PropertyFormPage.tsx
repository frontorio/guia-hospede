import { forwardRef, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useCreateProperty,
  usePropertyByCode,
  useUpdateProperty,
} from '../api/properties';
import { ErrorBanner, Spinner } from '../components/Feedback';
import { PhoneInput } from '../components/PhoneInput';
import { ACCESS_TYPES } from '../lib/accessTypes';
import type { Amenities, PropertyInput } from '../api/types';

/** Mantém apenas dígitos. */
const onlyDigits = (v: string) => v.replace(/\D/g, '');

/** Formata CEP brasileiro: 8 dígitos → "#####-###". */
function formatCep(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const emptyValues: PropertyInput = {
  code: '',
  name: '',
  property_type: '',
  bedroom_quantity: 1,
  bathroom_quantity: 1,
  guest_capacity: 1,
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
  },
  operational: {
    wifi_network: '',
    wifi_password: '',
    is_self_checkin: false,
    property_access_type: undefined,
    property_access_instructions: '',
    property_password: '',
    has_parking_spot: false,
    parking_spot_identifier: '',
    parking_spot_instructions: '',
  },
  rules: {
    check_in_time: '15:00',
    check_out_time: '11:00',
    allow_pet: false,
    smoking_permitted: false,
    suitable_for_children: true,
    suitable_for_babies: true,
    events_permitted: false,
  },
  amenities: {
    wifi: false,
    tv: false,
    air_conditioning: false,
    kitchen: false,
    washing_machine: false,
    elevator: false,
    balcony: false,
    pool: false,
    parking: false,
    bbq_grill: false,
    dishwasher: false,
  },
  images: [],
  host: { name: '', phone: '' },
};

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

export function PropertyFormPage() {
  const { code } = useParams();
  const isEdit = Boolean(code);
  const navigate = useNavigate();

  const { property: existing, isLoading } = usePropertyByCode(code);
  const createMut = useCreateProperty();
  const updateMut = useUpdateProperty(existing?.id ?? '');
  const mutation = isEdit ? updateMut : createMut;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<PropertyInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (existing) {
      reset({
        code: existing.code,
        name: existing.name,
        property_type: existing.property_type,
        bedroom_quantity: existing.bedroom_quantity,
        bathroom_quantity: existing.bathroom_quantity,
        guest_capacity: existing.guest_capacity,
        address: { ...emptyValues.address, ...existing.address },
        operational: { ...emptyValues.operational, ...existing.operational },
        rules: { ...emptyValues.rules, ...existing.rules },
        amenities: { ...emptyValues.amenities, ...existing.amenities },
        images: existing.images ?? [],
        host: { ...emptyValues.host, ...existing.host },
      });
    }
  }, [existing, reset]);

  const images = watch('images');

  const onSubmit = handleSubmit(async (values) => {
    const payload: PropertyInput = {
      ...values,
      // Remove URLs de imagem vazias antes de enviar.
      images: values.images.filter((url) => url.trim() !== ''),
      operational: {
        ...values.operational,
        // "" (opção "Selecione") vira undefined — o enum não aceita string vazia.
        property_access_type:
          values.operational.property_access_type || undefined,
      },
    };
    const saved = isEdit
      ? await updateMut.mutateAsync(payload)
      : await createMut.mutateAsync(payload);
    navigate(`/properties/${saved.code}`);
  });

  if (isEdit && isLoading) return <Spinner label="Carregando imóvel..." />;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Editar imóvel' : 'Novo imóvel'}
        </h1>
        <Link
          to={isEdit ? `/properties/${code}` : '/'}
          className="btn-secondary"
        >
          Cancelar
        </Link>
      </div>

      {mutation.isError && (
        <ErrorBanner message={(mutation.error as Error).message} />
      )}

      {/* Dados básicos */}
      <Section title="Dados básicos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código" error={errors.code?.message}>
            <input
              className="input"
              placeholder="FLN001"
              {...register('code', { required: 'Obrigatório' })}
            />
          </Field>
          <Field label="Tipo" error={errors.property_type?.message}>
            <input
              className="input"
              placeholder="Apartamento"
              {...register('property_type', { required: 'Obrigatório' })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nome" error={errors.name?.message}>
              <input
                className="input"
                placeholder="Apartamento Beira-Mar"
                {...register('name', { required: 'Obrigatório' })}
              />
            </Field>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Quartos">
            <input
              type="number"
              min={0}
              className="input"
              {...register('bedroom_quantity', { valueAsNumber: true, min: 0 })}
            />
          </Field>
          <Field label="Banheiros">
            <input
              type="number"
              min={0}
              className="input"
              {...register('bathroom_quantity', {
                valueAsNumber: true,
                min: 0,
              })}
            />
          </Field>
          <Field label="Hóspedes (máx.)">
            <input
              type="number"
              min={1}
              className="input"
              {...register('guest_capacity', { valueAsNumber: true, min: 1 })}
            />
          </Field>
        </div>
      </Section>

      {/* Endereço */}
      <Section title="Endereço">
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Field label="Rua" error={errors.address?.street?.message}>
              <input
                className="input"
                {...register('address.street', { required: 'Obrigatório' })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Número" error={errors.address?.number?.message}>
              <Controller
                control={control}
                name="address.number"
                rules={{ required: 'Obrigatório' }}
                render={({ field }) => (
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="589"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(onlyDigits(e.target.value))}
                  />
                )}
              />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Complemento">
              <input className="input" {...register('address.complement')} />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Bairro" error={errors.address?.neighborhood?.message}>
              <input
                className="input"
                {...register('address.neighborhood', {
                  required: 'Obrigatório',
                })}
              />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Cidade" error={errors.address?.city?.message}>
              <input
                className="input"
                {...register('address.city', { required: 'Obrigatório' })}
              />
            </Field>
          </div>
          <div className="sm:col-span-1">
            <Field label="UF" error={errors.address?.state?.message}>
              <input
                className="input uppercase"
                maxLength={2}
                {...register('address.state', {
                  required: 'Obrigatório',
                  maxLength: { value: 2, message: 'UF' },
                })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="CEP" error={errors.address?.postal_code?.message}>
              <Controller
                control={control}
                name="address.postal_code"
                rules={{
                  required: 'Obrigatório',
                  pattern: {
                    value: /^\d{5}-\d{3}$/,
                    message: 'CEP incompleto',
                  },
                }}
                render={({ field }) => (
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="88036-001"
                    maxLength={9}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(formatCep(e.target.value))}
                  />
                )}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* Acesso / operacional */}
      <Section title="Acesso e operacional">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rede WiFi">
            <input
              className="input"
              {...register('operational.wifi_network')}
            />
          </Field>
          <Field label="Senha WiFi">
            <input
              className="input"
              {...register('operational.wifi_password')}
            />
          </Field>
          <Field label="Tipo de acesso">
            <select
              className="input"
              {...register('operational.property_access_type')}
            >
              <option value="">Selecione...</option>
              {ACCESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Senha do imóvel">
            <input
              className="input"
              {...register('operational.property_password')}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Instruções de acesso">
              <input
                className="input"
                {...register('operational.property_access_instructions')}
              />
            </Field>
          </div>
          <Field label="Vaga (identificação)">
            <input
              className="input"
              {...register('operational.parking_spot_identifier')}
            />
          </Field>
          <Field label="Instruções de estacionamento">
            <input
              className="input"
              {...register('operational.parking_spot_instructions')}
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <Checkbox
            label="Check-in autônomo"
            {...register('operational.is_self_checkin')}
          />
          <Checkbox
            label="Possui vaga de garagem"
            {...register('operational.has_parking_spot')}
          />
        </div>
      </Section>

      {/* Regras */}
      <Section title="Regras da estadia">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in">
            <input
              type="time"
              className="input"
              {...register('rules.check_in_time')}
            />
          </Field>
          <Field label="Check-out">
            <input
              type="time"
              className="input"
              {...register('rules.check_out_time')}
            />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Checkbox label="Aceita pets" {...register('rules.allow_pet')} />
          <Checkbox
            label="Permite fumar"
            {...register('rules.smoking_permitted')}
          />
          <Checkbox
            label="Adequado p/ crianças"
            {...register('rules.suitable_for_children')}
          />
          <Checkbox
            label="Adequado p/ bebês"
            {...register('rules.suitable_for_babies')}
          />
          <Checkbox
            label="Permite eventos"
            {...register('rules.events_permitted')}
          />
        </div>
      </Section>

      {/* Amenidades */}
      <Section title="Amenidades">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(AMENITY_LABELS) as (keyof Amenities)[]).map((key) => (
            <Checkbox
              key={key}
              label={AMENITY_LABELS[key]}
              {...register(`amenities.${key}` as const)}
            />
          ))}
        </div>
      </Section>

      {/* Imagens */}
      <Section title="Fotos (URLs)">
        <div className="space-y-2">
          {images.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="input"
                placeholder="https://..."
                value={url}
                onChange={(e) =>
                  setValue(
                    'images',
                    images.map((v, i) => (i === index ? e.target.value : v)),
                  )
                }
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setValue(
                    'images',
                    images.filter((_, i) => i !== index),
                  )
                }
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setValue('images', [...images, ''])}
          >
            + Adicionar foto
          </button>
        </div>
      </Section>

      {/* Anfitrião */}
      <Section title="Anfitrião">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" error={errors.host?.name?.message}>
            <input
              className="input"
              {...register('host.name', { required: 'Obrigatório' })}
            />
          </Field>
          <Field label="Telefone" error={errors.host?.phone?.message}>
            <Controller
              control={control}
              name="host.phone"
              rules={{ required: 'Obrigatório' }}
              render={({ field }) => (
                <PhoneInput value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <Link
          to={isEdit ? `/properties/${code}` : '/'}
          className="btn-secondary"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="btn-primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? 'Salvando...'
            : isEdit
              ? 'Salvar alterações'
              : 'Criar imóvel'}
        </button>
      </div>
    </form>
  );
}

/* ---- Componentes auxiliares de formulário ---- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const Checkbox = forwardRef<
  HTMLInputElement,
  { label: string } & React.InputHTMLAttributes<HTMLInputElement>
>(function Checkbox({ label, ...props }, ref) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" className="h-4 w-4 rounded" ref={ref} {...props} />
      {label}
    </label>
  );
});
