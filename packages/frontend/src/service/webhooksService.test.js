import api, { conToken } from './api';
import {
  actualizarWebhook,
  crearWebhook,
  eliminarWebhook,
  listarWebhooks,
  probarWebhook,
  regenerarSecretoWebhook,
} from './webhooksService';

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    delete: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
  conToken: jest.fn((token) => ({ headers: { Authorization: `Bearer ${token}` } })),
}));

describe('servicio de webhooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({ data: {} });
    api.put.mockResolvedValue({ data: {} });
    api.delete.mockResolvedValue({});
  });

  it('usa las rutas del colectivo y agrega autenticación en todas las operaciones', async () => {
    await listarWebhooks('token', 'colectivo-1');
    await crearWebhook('token', 'colectivo-1', { url: 'https://destino.example' });
    await actualizarWebhook('token', 'colectivo-1', 'webhook-1', { activo: false });
    await eliminarWebhook('token', 'colectivo-1', 'webhook-1');
    await probarWebhook('token', 'colectivo-1', 'webhook-1');
    await regenerarSecretoWebhook('token', 'colectivo-1', 'webhook-1');

    expect(api.get).toHaveBeenCalledWith('/colectivos/colectivo-1/webhooks', conToken('token'));
    expect(api.post).toHaveBeenNthCalledWith(
      1,
      '/colectivos/colectivo-1/webhooks',
      { url: 'https://destino.example' },
      conToken('token'),
    );
    expect(api.put).toHaveBeenCalledWith(
      '/colectivos/colectivo-1/webhooks/webhook-1',
      { activo: false },
      conToken('token'),
    );
    expect(api.delete).toHaveBeenCalledWith(
      '/colectivos/colectivo-1/webhooks/webhook-1',
      conToken('token'),
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      '/colectivos/colectivo-1/webhooks/webhook-1/prueba',
      {},
      conToken('token'),
    );
    expect(api.post).toHaveBeenNthCalledWith(
      3,
      '/colectivos/colectivo-1/webhooks/webhook-1/secreto',
      {},
      conToken('token'),
    );
  });
});
