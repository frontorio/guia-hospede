// Tipos espelhando os contratos da API (snake_case).

export interface Address {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface Operational {
  wifi_network?: string | null;
  wifi_password?: string | null;
  is_self_checkin: boolean;
  property_access_type?: string | null;
  property_access_instructions?: string | null;
  property_password?: string | null;
  has_parking_spot: boolean;
  parking_spot_identifier?: string | null;
  parking_spot_instructions?: string | null;
}

export interface Rules {
  check_in_time: string;
  check_out_time: string;
  allow_pet: boolean;
  smoking_permitted: boolean;
  suitable_for_children: boolean;
  suitable_for_babies: boolean;
  events_permitted: boolean;
}

export interface Amenities {
  wifi?: boolean;
  tv?: boolean;
  air_conditioning?: boolean;
  kitchen?: boolean;
  washing_machine?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  pool?: boolean;
  parking?: boolean;
  bbq_grill?: boolean;
  dishwasher?: boolean;
}

export interface Host {
  name: string;
  phone: string;
}

export interface GuideItem {
  name: string;
  distance: string;
  description: string;
}

export interface EssentialItem extends GuideItem {
  type: string;
}

export interface Guidebook {
  property_id: string;
  welcome_message: string;
  restaurants: GuideItem[];
  attractions: GuideItem[];
  essentials: EssentialItem[];
  seasonal_tips: string;
  model: string | null;
  generated_at: string;
}

export interface Property {
  id: string;
  code: string;
  name: string;
  property_type: string;
  bedroom_quantity: number;
  bathroom_quantity: number;
  guest_capacity: number;
  address: Address;
  operational: Operational;
  rules: Rules;
  amenities: Amenities;
  images: string[];
  host: Host;
  guidebook: Guidebook | null;
  created_at: string;
  updated_at: string;
}

/** Corpo de criação/edição de imóvel (snake_case, sem campos gerados). */
export interface PropertyInput {
  code: string;
  name: string;
  property_type: string;
  bedroom_quantity: number;
  bathroom_quantity: number;
  guest_capacity: number;
  address: Address;
  operational: Operational;
  rules: Rules;
  amenities: Amenities;
  images: string[];
  host: Host;
}
