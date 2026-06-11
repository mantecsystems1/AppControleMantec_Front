import apiCliente from './apiCliente';

const normalizeStatus = (status) =>
  String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const isStatusConcluido = (status) => normalizeStatus(status) === 'concluido';

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const mapProdutosValidos = (produtos = []) =>
  (Array.isArray(produtos) ? produtos : [])
    .map((item) => ({
      produtoID: item?.produtoID || item?.ProdutoID || item?.id || '',
      quantidade: toNumber(item?.quantidade ?? item?.Quantidade, 0),
    }))
    .filter((item) => item.produtoID && item.quantidade > 0);

export const buscarEstoques = async () => {
  const response = await apiCliente.get('/Estoque');
  return Array.isArray(response.data) ? response.data : [];
};

export const anexarEstoqueAProdutos = (produtos = [], estoques = []) => {
  const estoquePorProduto = new Map(
    (Array.isArray(estoques) ? estoques : [])
      .filter((item) => item?.ativo !== false)
      .map((item) => [String(item.produtoID || item.ProdutoID || ''), item])
  );

  return (Array.isArray(produtos) ? produtos : []).map((produto) => {
    const estoque = estoquePorProduto.get(String(produto.id));
    return {
      ...produto,
      quantidade: toNumber(estoque?.quantidade ?? estoque?.Quantidade, 0),
      estoqueId: estoque?.id || estoque?.Id || '',
      estoque,
    };
  });
};

export const buscarProdutosComEstoque = async () => {
  const [produtosResp, estoques] = await Promise.all([
    apiCliente.get('/Produto'),
    buscarEstoques(),
  ]);

  return anexarEstoqueAProdutos(produtosResp.data || [], estoques);
};

export const ajustarEstoquePorProdutos = async (produtos = [], direction = -1) => {
  const itens = mapProdutosValidos(produtos);
  if (!itens.length) return;

  let estoqueList = [];
  try {
    const estoqueResp = await apiCliente.get('/Estoque');
    estoqueList = Array.isArray(estoqueResp.data) ? estoqueResp.data : [];
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
  }

  const estoqueMap = new Map(
    estoqueList.map((item) => [String(item.produtoID || item.ProdutoID), item])
  );

  for (const item of itens) {
    const produtoID = String(item.produtoID);
    const delta = direction * item.quantidade;
    const estoqueItem = estoqueMap.get(produtoID);

    let baseQuantidade = toNumber(estoqueItem?.quantidade, NaN);
    if (!Number.isFinite(baseQuantidade)) {
      baseQuantidade = 0;
    }

    let novaQuantidade = baseQuantidade + delta;
    if (novaQuantidade < 0) {
      console.warn(`Estoque negativo para produto ${produtoID}. Ajustando para 0.`);
      novaQuantidade = 0;
    }

    const dataAtualizacao = new Date().toISOString();

    try {
      if (estoqueItem) {
        await apiCliente.put(`/Estoque/${estoqueItem.id}`, {
          ...estoqueItem,
          produtoID,
          quantidade: novaQuantidade,
          dataAtualizacao,
        });
      } else {
        await apiCliente.post('/Estoque', {
          produtoID,
          quantidade: novaQuantidade,
          dataAtualizacao,
          ativo: true,
        });
      }
    } catch (error) {
      console.error(`Erro ao atualizar estoque do produto ${produtoID}:`, error);
    }
  }
};
