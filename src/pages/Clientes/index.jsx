import React, { useState, useEffect } from 'react';
import {
  ClientesContainer,
  ClientesTitle,
  HeaderControls,
  SearchContainer,
  SearchInput,
  PerPageSelect,
  AddButton,
  ClientesTable,
  ClientesTableWrapper,
  IconWrapper,
  ActionButton,
  PaginationContainer,
  PaginationButton,
  PaginationInfo,
  HideMobile,
  HideMobileTh
} from './style';

import ModalDetalhes from '../../components/Modais/Cliente/ModalDetalhes';
import ModalEdicao from '../../components/Modais/Cliente/ModalEdicao';
import ModalNovo from '../../components/Modais/Cliente/ModalNovo';
import apiCliente from '../../services/apiCliente';

import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faPlus, faPlusCircle, faDownload } from '@fortawesome/free-solid-svg-icons';
import { FaWhatsapp } from 'react-icons/fa';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

Modal.setAppElement('#root');

const Clientes = () => {
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [clientes, setClientes] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchClientes();
  }, [currentPage, itemsPerPage]);

  const fetchClientes = async () => {
    try {
      const response = await apiCliente.get('/Cliente', {
        params: {
          page: 1,
          pageSize: 6000,
        },
      });
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const handleExcluir = async (id) => {
    const confirmar = window.confirm('Deseja excluir esse cliente?');
    if (confirmar) {
      try {
        const response = await apiCliente.delete(`/Cliente/Desativar/${id}`);
        console.log('Cliente Excluído:', response.data);
        fetchClientes();
        alert('Cliente excluído com sucesso!');
      } catch (error) {
        if (error.response) {
          console.error('Erro ao desativar cliente:', error.response.data);
        } else {
          console.error('Erro desconhecido ao desativar cliente:', error.message);
        }
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
    fetchClientes();
  };

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        await apiCliente.put(`/Cliente/${formData.id}`, formData);
      } else {
        await apiCliente.post('/Cliente', formData);
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');
      
      if (filteredClientes.length === 0) {
        worksheet.addRow(['Nenhum cliente para exportar']);
      } else {
        const headers = Object.keys(filteredClientes[0]);
        worksheet.addRow(headers);
        filteredClientes.forEach(cliente => {
          worksheet.addRow(Object.values(cliente));
        });
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'clientes.xlsx');
    } catch (error) {
      console.error('Erro ao exportar clientes:', error);
      alert('Erro ao exportar clientes para Excel');
    }
  };

  // Filtra clientes pelo nome E apenas os ativos
const filteredClientes = clientes.filter(
  (cliente) =>
    cliente.ativo === true &&
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
);


  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleWhatsApp = (telefone) => {
    if (telefone) {
      const whatsappUrl = `https://wa.me/${telefone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <ClientesContainer>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <ClientesTitle>
          Clientes
        </ClientesTitle>
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
            placeholder="Buscar cliente por nome..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <PerPageSelect
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={75}>75 por página</option>
            <option value={100}>100 por página</option>
          </PerPageSelect>
        </SearchContainer>
        
        <AddButton onClick={openNovoModal}>
          <FontAwesomeIcon icon={faPlus} />
          Novo Cliente
        </AddButton>
      </HeaderControls>

      <ClientesTableWrapper>
        <ClientesTable>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <HideMobileTh>Email</HideMobileTh>
              <HideMobileTh>Data de Cadastro</HideMobileTh>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nome}</td>
                <td>{cliente.telefone}</td>
                <HideMobile>{cliente.email}</HideMobile>
                <HideMobile>{new Date(cliente.dataCadastro).toLocaleDateString()}</HideMobile>
                <td>
                  <IconWrapper>
                    <ActionButton className="view" onClick={() => openDetalhesModal(cliente)}>
                      <FontAwesomeIcon icon={faEye} />
                    </ActionButton>
                    <ActionButton className="edit" onClick={() => openEdicaoModal(cliente)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </ActionButton>
                    <ActionButton className="delete" onClick={() => handleExcluir(cliente.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </ActionButton>
                    {cliente.telefone && (
                      <span onClick={() => handleWhatsApp(cliente.telefone)} title="Enviar WhatsApp" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', margin: '0 2px' }}>
                        <FaWhatsapp size={30} color="#25D366" />
                      </span>
                    )}
                  </IconWrapper>
                </td>
              </tr>
            ))}
          </tbody>
        </ClientesTable>
      </ClientesTableWrapper>

      <PaginationContainer>
        <PaginationButton 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Anterior
        </PaginationButton>
        <PaginationInfo>
          Página {currentPage} de {totalPages}
        </PaginationInfo>
        <PaginationButton 
          disabled={currentPage === totalPages} 
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Próxima
        </PaginationButton>
      </PaginationContainer>

      <ModalDetalhes isOpen={isDetalhesModalOpen} onClose={closeModal} item={selectedItem} />
      <ModalEdicao isOpen={isEdicaoModalOpen} onClose={closeModal} item={selectedItem} onSubmit={handleSave} />
      <ModalNovo isOpen={isNovoModalOpen} onClose={closeModal} onSubmit={handleSave} />
    </ClientesContainer>
  );
};

export default Clientes;
