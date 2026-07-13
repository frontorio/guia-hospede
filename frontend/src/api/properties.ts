import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './client';
import type { Guidebook, Property, PropertyInput } from './types';

const keys = {
  all: ['properties'] as const,
  detail: (id: string) => ['properties', id] as const,
  guidebook: (id: string) => ['properties', id, 'guidebook'] as const,
};

/** Lista todos os imóveis. */
export function useProperties() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => http.get<Property[]>('/properties'),
  });
}

/** Busca um imóvel pelo id. */
export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? ''),
    queryFn: () => http.get<Property>(`/properties/${id}`),
    enabled: Boolean(id),
  });
}

/**
 * Localiza um imóvel pelo CODE de negócio, reaproveitando a listagem
 * (que já retorna os imóveis completos, incluindo o guidebook).
 */
export function usePropertyByCode(code: string | undefined) {
  const query = useProperties();
  const property = code ? query.data?.find((p) => p.code === code) : undefined;
  return { ...query, property };
}

/** Cria um novo imóvel. */
export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PropertyInput) =>
      http.post<Property>('/properties', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

/** Atualiza um imóvel existente. */
export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PropertyInput>) =>
      http.put<Property>(`/properties/${id}`, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.setQueryData(keys.detail(id), data);
    },
  });
}

/** Busca (gerando sob demanda) o guidebook do imóvel. */
export function useGuidebook(id: string | undefined) {
  return useQuery({
    queryKey: keys.guidebook(id ?? ''),
    queryFn: () => http.get<Guidebook>(`/properties/${id}/guidebook`),
    enabled: Boolean(id),
    retry: false, // 429/502 não devem ser reexecutados automaticamente
  });
}

/** Regenera o guidebook do imóvel. */
export function useRefreshGuidebook(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      http.post<Guidebook>(`/properties/${id}/guidebook/refresh`),
    onSuccess: (data) => {
      qc.setQueryData(keys.guidebook(id), data);
      qc.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
}
