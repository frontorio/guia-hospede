import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.property.upsert({
    where: { code: 'FLN001' },
    update: {},
    create: {
      code: 'FLN001',
      name: 'Apartamento Beira-Mar Florianópolis',
      propertyType: 'Apartamento',
      bedroomQuantity: 2,
      bathroomQuantity: 1,
      guestCapacity: 4,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      ],
      address: {
        create: {
          street: 'Rua Lauro Linhares',
          number: '589',
          complement: 'Apto 301',
          neighborhood: 'Trindade',
          city: 'Florianópolis',
          state: 'SC',
          postalCode: '88036-001',
        },
      },
      operational: {
        create: {
          wifiNetwork: 'SeaHome_FLN001',
          wifiPassword: 'floripa2024',
          isSelfCheckin: true,
          propertyAccessType: 'smart_lock',
          propertyAccessInstructions:
            'Use o código 4521 na fechadura eletrônica',
          propertyPassword: '4521',
          hasParkingSpot: true,
          parkingSpotIdentifier: 'Vaga 12 — subsolo B1',
          parkingSpotInstructions: 'Portão lateral, código 7890 no interfone',
        },
      },
      rules: {
        create: {
          checkInTime: '15:00',
          checkOutTime: '11:00',
          allowPet: false,
          smokingPermitted: false,
          suitableForChildren: true,
          suitableForBabies: true,
          eventsPermitted: false,
        },
      },
      amenities: {
        create: {
          wifi: true,
          tv: true,
          airConditioning: true,
          kitchen: true,
          washingMachine: true,
          elevator: true,
          balcony: true,
        },
      },
      host: {
        create: {
          name: 'Ana Paula',
          phone: '+5548991234567',
        },
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed concluído: imóvel FLN001 disponível.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
