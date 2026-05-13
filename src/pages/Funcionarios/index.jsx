import React, { useState, useEffect } from 'react';
import { 
  FuncionariosContainer, 
  FuncionariosTitle, 
  HeaderControls,
  SearchContainer,
  SearchInput,
  PerPageSelect,
  AddButton,
  FuncionariosTableWrapper,
  FuncionariosTable, 
  IconWrapper,
  ActionButton,
  PaginationContainer,
  PaginationButton,
  PaginationInfo,
  HideMobile,
  HideMobileTh
} from './style';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEye, faEdit, faTrashAlt, faDownload } from '@fortawesome/free-solid-svg-icons';
import ModalDetalhes from '../../components/Modais/Funcionario/ModalDetalhes';
import ModalEdicaoFuncionario from '../../components/Modais/Funcionario/ModalEdicao';
import ModalNovo from '../../components/Modais/Funcionario/ModalNovo';
import apiCliente from '../../services/apiCliente';
import Modal from 'react-modal';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

Modal.setAppElement('#root');

const Funcionarios = () => {
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const fetchFuncionarios = async () => {
    try {
      const response = await apiCliente.get('/Funcionario');
      setFuncionarios(response.data.filter(funcionario => funcionario.ativo));
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  const handleExcluir = async (id) => {
    const confirmar = window.confirm('Deseja excluir esse funcionário?');
    if (confirmar) {
      try {
        await apiCliente.delete(`/Funcionario/Desativar/${id}`);
        fetchFuncionarios();
        alert('Funcionário excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao desativar funcionário:', error);
      }
    }
  };

  const openDetalhesModal = (item) => {
    setSelectedItem(item);
    setIsDetalhesModalOpen(true);
  };

  const openEdicaoModal = (item) => {
    setSelectedItem(item);
    setIsEdicaoModalOpen(true);
  };

  const openNovoModal = () => {
    setSelectedItem(null);
    setIsNovoModalOpen(true);
  };

  const closeModal = () => {
    setIsDetalhesModalOpen(false);
    setIsEdicaoModalOpen(false);
    setIsNovoModalOpen(false);
    setSelectedItem(null);
    fetchFuncionarios();
  };

  const handleCreate = async (formData) => {
    try {
      await apiCliente.post('/Funcionario', formData);
      fetchFuncionarios();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await apiCliente.put(`/Funcionario/${formData.id}`, formData);
      fetchFuncionarios();
      closeModal();
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
    }
  };

  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Funcionarios');
      
      if (filteredFuncionarios.length === 0) {
        worksheet.addRow(['Nenhum funcionário para exportar']);
      } else {
        const headers = Object.keys(filteredFuncionarios[0]);
        worksheet.addRow(headers);
        filteredFuncionarios.forEach(funcionario => {
          worksheet.addRow(Object.values(funcionario));
        });
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'funcionarios.xlsx');
    } catch (error) {
      console.error('Erro ao exportar funcionários:', error);
      alert('Erro ao exportar funcionários para Excel');
    }
  };

  const filteredFuncionarios = funcionarios.filter(funcionario =>
    funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFuncionarios.length / itemsPerPage);
  const paginatedFuncionarios = filteredFuncionarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <FuncionariosContainer>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <FuncionariosTitle>
          Funcionários
        </FuncionariosTitle>
        <button
          onClick={handleExport}
          title="Exportar Excel"
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: '#666'
          }}
        >
          <FontAwesomeIcon icon={faDownload} size="lg" />
        </button>
      </div>
      
      <HeaderControls>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <PerPageSelect 
            value={itemsPerPage} 
            onChange={e => setItemsPerPage(Number(e.target.value))}
          >
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </PerPageSelect>
        </SearchContainer>
        
        <AddButton onClick={openNovoModal}>
          <FontAwesomeIcon icon={faPlusCircle} />
          Novo Funcionário
        </AddButton>
      </HeaderControls>

      <FuncionariosTableWrapper>
        <FuncionariosTable>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Telefone</th>
              <HideMobileTh>E-mail</HideMobileTh>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFuncionarios.map(funcionario => (
              <tr key={funcionario.id}>
                <td>{funcionario.nome}</td>
                <td>{funcionario.cargo}</td>
                <td>{funcionario.telefone}</td>
                <HideMobile>{funcionario.email}</HideMobile>
                <td>
                  <IconWrapper>
                    <ActionButton 
                      className="view"
                      onClick={() => openDetalhesModal(funcionario)}
                      title="Visualizar detalhes"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </ActionButton>
                    <ActionButton 
                      className="edit"
                      onClick={() => openEdicaoModal(funcionario)}
                      title="Editar funcionário"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </ActionButton>
                    <ActionButton 
                      className="delete"
                      onClick={() => handleExcluir(funcionario.id)}
                      title="Excluir funcionário"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </ActionButton>
                  </IconWrapper>
                </td>
              </tr>
            ))}
          </tbody>
        </FuncionariosTable>
      </FuncionariosTableWrapper>

      <PaginationContainer>
        <PaginationButton
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </PaginationButton>
        
        <PaginationInfo>
          Página {currentPage} de {totalPages} ({filteredFuncionarios.length} funcionários)
        </PaginationInfo>
        
        <PaginationButton
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próxima
        </PaginationButton>
      </PaginationContainer>

      <ModalDetalhes isOpen={isDetalhesModalOpen} onClose={closeModal} item={selectedItem} />
      <ModalEdicaoFuncionario isOpen={isEdicaoModalOpen} onClose={closeModal} item={selectedItem} onSubmit={handleUpdate} />
      <ModalNovo isOpen={isNovoModalOpen} onClose={closeModal} onSubmit={handleCreate} />
    </FuncionariosContainer>
  );
};

export default Funcionarios;
