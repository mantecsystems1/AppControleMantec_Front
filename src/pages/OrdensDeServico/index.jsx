import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  OrdemDeServicoContainer,
  OrdemDeServicoTitle,
  HeaderControls,
  SearchContainer,
  SearchInput,
  SelectStatus,
  PerPageSelect,
  AddButton,
  OrdemDeServicoTableWrapper,
  OrdemDeServicoTable,
  IconWrapper,
  ActionButton,
  PaginationContainer,
  PaginationButton,
  PaginationInfo,
  HideMobile,
  HideMobileTh
} from './style';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEye, faEdit, faTrash, faStar } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
import apiCliente from '../../services/apiCliente';
import ModalDetalhesOrdemDeServico from '../../components/Modais/OrdemDeServico/ModalDetalhes';
import ModalEdicaoOrdemDeServico from '../../components/Modais/OrdemDeServico/ModalEdicao';
import ModalNovoOrdemDeServico from '../../components/Modais/OrdemDeServico/ModalNovo';


Modal.setAppElement('#root');

/* =========================
   UTILIDADES
========================= */

const parseDate = d => {
  if (!d) return new Date(0);
  const dt = new Date(d);
  return isNaN(dt) ? new Date(0) : dt;
};

const formatDate = d => {
  if (!d) return '--/--/----';
  const date = new Date(d);
  // Ajusta para timezone local
  const localDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset()) * 60000);
  return localDate.toLocaleDateString('pt-BR');
};

/* =========================
   COMPONENTE
========================= */

const OrdemDeServico = () => {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState({});
  const [produtos, setProdutos] = useState({});
  const [servicos, setServicos] = useState({});

  const [selectedItem, setSelectedItem] = useState(null);
  const [modal, setModal] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  /* =========================
     FETCH OTIMIZADO
  ========================= */

  const fetchOrdens = useCallback(async () => {
    try {
      const osRes = await apiCliente.get('/OrdemDeServico');
      setOrdens(
        osRes.data
          .filter(o => o.ativo)
          .sort((a, b) => parseDate(b.dataEntrada) - parseDate(a.dataEntrada))
      );
    } catch (e) {
      console.error('Erro ao carregar ordens de serviço:', e);
    }
  }, []);

  useEffect(() => {
    const fetchAllInitialData = async () => {
      try {
        await fetchOrdens(); // Fetch ordens using the new function

        const [cliRes, prodRes, servRes] = await Promise.all([
          apiCliente.get('/Cliente'),
          apiCliente.get('/Produto'),
          apiCliente.get('/Servico'),
        ]);

        setClientes(Object.fromEntries(cliRes.data.map(c => [c.id, c.nome])));
        setProdutos(Object.fromEntries(prodRes.data.map(p => [p.id, p.nome])));
        setServicos(Object.fromEntries(servRes.data.map(s => [s.id, s.nome])));
      } catch (e) {
        console.error('Erro ao carregar dados iniciais:', e);
      }
    };

    fetchAllInitialData();
  }, [fetchOrdens]); // Add fetchOrdens to dependency array

  /* =========================
     FILTRO + PAGINAÇÃO
  ========================= */

  const filteredOrdens = useMemo(() => {
    return ordens.filter(o => {
      const nomeCliente = clientes[o.clienteID]?.toLowerCase() || '';
      const statusLower = (o.status || '').toLowerCase();
      return (
        nomeCliente.includes(searchTerm.toLowerCase()) &&
        statusLower !== 'entregue' &&
        (!statusFilter || o.status === statusFilter)
      );
    });
  }, [ordens, clientes, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrdens.length / itemsPerPage));

  const paginatedOrdens = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrdens.slice(start, start + itemsPerPage);
  }, [filteredOrdens, currentPage, itemsPerPage]);

  /* =========================
     AÇÕES
  ========================= */

  const handleExcluir = useCallback(async id => {
    if (!window.confirm('Deseja excluir esta ordem?')) return;
    await apiCliente.put(`/OrdemDeServico/desativar/${id}`);
    setOrdens(prev => prev.filter(o => o.id !== id));
  }, []);

  const handleUpdate = useCallback(async (updatedData) => {
    try {
      const response = await apiCliente.put(`/OrdemDeServico/${updatedData.id}`, updatedData);
      setOrdens(prev => prev.map(o => o.id === updatedData.id ? response.data : o));
      closeModal();
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
    }
  }, []);

  const openModal = (type, item = null) => {
    setSelectedItem(item);
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedItem(null);
  };

  const handleOrderSaved = useCallback(() => {
    fetchOrdens(); // Refresh the list
    closeModal();   // Close the modal
  }, [fetchOrdens]);

  /* =========================
     FORMATADORES
  ========================= */

  const getProdutos = ordem => {
    if (ordem.pecasUtilizadas?.length) {
      return ordem.pecasUtilizadas
        .map(p => `${produtos[p.produtoID] || p.produtoID} (${p.quantidade || 1})`)
        .join(', ');
    }

    if (ordem.produtoIDs?.length) {
      return ordem.produtoIDs.map(id => produtos[id] || id).join(', ');
    }

    return '-';
  };

  const getServicos = ordem =>
    ordem.servicoIDs?.length
      ? ordem.servicoIDs.map(id => servicos[id] || id).join(', ')
      : '-';

  /* =========================
     RENDER
  ========================= */

  return (
    <OrdemDeServicoContainer>
      <OrdemDeServicoTitle>Ordens de Serviço</OrdemDeServicoTitle>

      <HeaderControls>
        <SearchContainer>
          <SearchInput
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <SelectStatus value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="Não iniciado">Não iniciado</option>
            <option value="Aguardando Peças">Aguardando Peças</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluido">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </SelectStatus>

          <PerPageSelect value={itemsPerPage} onChange={e => setItemsPerPage(+e.target.value)}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </PerPageSelect>
        </SearchContainer>

        <AddButton onClick={() => openModal('novo')}>
          <FontAwesomeIcon icon={faPlusCircle} /> Nova Ordem
        </AddButton>
      </HeaderControls>

      <OrdemDeServicoTableWrapper>
        <OrdemDeServicoTable>
          <thead>
            <tr>
              <th>OS</th>
              <th>Cliente</th>
              <th>Status</th>
              <HideMobileTh>Entrada</HideMobileTh>
              <HideMobileTh>Conclusão</HideMobileTh>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrdens.map(o => (
              <tr key={o.id}>
                <td>{o.numeroOS}</td>
                <td>{clientes[o.clienteID]}</td>
                <td>{o.status}</td>
                <HideMobile>{formatDate(o.dataEntrada)}</HideMobile>
                <HideMobile>{formatDate(o.dataConclusao)}</HideMobile>
                <td>
                  <IconWrapper>
                    <ActionButton className="view" onClick={() => openModal('detalhes', o)}>
                      <FontAwesomeIcon icon={faEye} />
                    </ActionButton>
                    <ActionButton className="edit" onClick={() => openModal('edicao', o)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </ActionButton>
                    <ActionButton className="delete" onClick={() => handleExcluir(o.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </ActionButton>
                    <ActionButton
                      className="status"
                      onClick={() => window.open(`/ordem-os/${o.id}`, '_blank')}
                    >
                      <FontAwesomeIcon icon={faStar} />
                    </ActionButton>
                  </IconWrapper>
                </td>
              </tr>
            ))}
          </tbody>
        </OrdemDeServicoTable>
      </OrdemDeServicoTableWrapper>

      <PaginationContainer>
        <PaginationButton disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
          Anterior
        </PaginationButton>

        <PaginationInfo>
          Página {currentPage} de {totalPages}
        </PaginationInfo>

        <PaginationButton
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Próxima
        </PaginationButton>
      </PaginationContainer>

      <ModalDetalhesOrdemDeServico isOpen={modal === 'detalhes'} onClose={closeModal} item={selectedItem} />
      <ModalEdicaoOrdemDeServico isOpen={modal === 'edicao'} onClose={closeModal} item={selectedItem} onSubmit={handleUpdate} onOrderSaved={handleOrderSaved} />
      <ModalNovoOrdemDeServico isOpen={modal === 'novo'} onClose={closeModal} onOrderSaved={handleOrderSaved} />
    </OrdemDeServicoContainer>
  );
};

export default OrdemDeServico;
