import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [{ provide: PropertiesService, useValue: service }],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  it('está definido', () => {
    expect(controller).toBeDefined();
  });

  it('POST delega para service.create', async () => {
    const dto = { code: 'FLN001' } as never;
    service.create.mockResolvedValue({ id: '1' });

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1' });
  });

  it('GET (lista) delega para service.findAll', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll();

    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('GET (id) delega para service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: '1' });

    const result = await controller.findOne('1');

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });

  it('PUT delega para service.update', async () => {
    const dto = { name: 'x' } as never;
    service.update.mockResolvedValue({ id: '1', name: 'x' });

    const result = await controller.update('1', dto);

    expect(service.update).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual({ id: '1', name: 'x' });
  });
});
