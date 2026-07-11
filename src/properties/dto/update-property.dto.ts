import { PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

/**
 * Corpo aceito no PUT. Todos os campos de topo tornam-se opcionais; quando
 * um sub-objeto (address, operational, rules, amenities, host) é enviado,
 * ele substitui integralmente o registro correspondente.
 */
export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
