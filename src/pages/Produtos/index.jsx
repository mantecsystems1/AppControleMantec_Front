// Este é o componente Produto com paginação, filtro e seleção de itens por página
// Mantém as modais e as funcionalidades já existentes

import React, { useState, useEffect } from 'react';
import { 
  ProdutosContainer, 
  ProdutosTitle, 
  HeaderControls,
  SearchContainer,
  SearchInput,
  PerPageSelect,
  AddButton,
  ProdutosTableWrapper,
  ProdutosTable, 
  IconWrapper,
  ActionButton,
  PaginationContainer,
  PaginationButton,
  PaginationInfo,
  HideMobile,
  HideMobileTh
} from './style';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faPlusCircle, faEdit, faTrash, faEye, faDownload } from '@fortawesome/free-solid-svg-icons';
import ModalDetalhesProduto from '../../components/Modais/Produto/ModalDetalhes';
import ModalEdicaoProduto from '../../components/Modais/Produto/ModalEdicao';
import ModalNovoProduto from '../../components/Modais/Produto/ModalNovo';
import ModalCadastrarImagem from '../../components/Modais/CadastrarImagem';
import apiCliente from '../../services/apiCliente';
import { buscarProdutosComEstoque } from '../../services/estoque';
import Modal from 'react-modal';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

Modal.setAppElement('#root');

const Produto = () => {
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [isCadastrarImagemModalOpen, setIsCadastrarImagemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const produtosComEstoque = await buscarProdutosComEstoque();
      setProdutos(produtosComEstoque.filter(produto => produto.ativo));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleExcluir = async (id) => {
    const confirmar = window.confirm('Deseja excluir esse produto?');
    if (confirmar) {
      try {
        await apiCliente.delete(`/Produto/Desativar/${id}`);
        fetchProdutos();
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao desativar produto:', error);
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

  const openCadastrarImagemModal = (item) => {
    setSelectedItem(item);
    setIsCadastrarImagemModalOpen(true);
  };

  const closeModal = () => {
    setIsDetalhesModalOpen(false);
    setIsEdicaoModalOpen(false);
    setIsNovoModalOpen(false);
    setIsCadastrarImagemModalOpen(false);
    setSelectedItem(null);
    fetchProdutos();
  };

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        await apiCliente.put(`/Produto/${formData.id}`, formData);
      } else {
        await apiCliente.post('/Produto', formData);
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Produtos');
      
      if (filteredProdutos.length === 0) {
        worksheet.addRow(['Nenhum produto para exportar']);
      } else {
        const headers = Object.keys(filteredProdutos[0]);
        worksheet.addRow(headers);
        filteredProdutos.forEach(produto => {
          worksheet.addRow(Object.values(produto));
        });
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'produtos.xlsx');
    } catch (error) {
      console.error('Erro ao exportar produtos:', error);
      alert('Erro ao exportar produtos para Excel');
    }
  };

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage);
  const paginatedProdutos = filteredProdutos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <ProdutosContainer>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <ProdutosTitle style={{ textAlign: 'left', margin: 0 }}>
          Produtos
        </ProdutosTitle>
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
            placeholder="Buscar produto..."
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
          Novo Produto
        </AddButton>
      </HeaderControls>

      <ProdutosTableWrapper>
        <ProdutosTable>
          <thead>
            <tr>
              <HideMobileTh>Imagem</HideMobileTh>
              <th>Nome</th>
              <HideMobileTh>Descrição</HideMobileTh>
              <th>Qtde</th>
              <th>Preço</th>
              <HideMobileTh>Fornecedor</HideMobileTh>
              <HideMobileTh>Data de Entrada</HideMobileTh>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProdutos.map(produto => (
              <tr key={produto.id}>
                <HideMobile><img src={produto.imagemURL} alt={produto.nome} width="50" /></HideMobile>
                <td>{produto.nome}</td>
                <HideMobile>{produto.descricao}</HideMobile>
                <td>{produto.quantidade ?? 0}</td>
                <td>{`R$ ${produto.preco.toFixed(2)}`}</td>
                <HideMobile>{produto.fornecedor}</HideMobile>
                <HideMobile>{new Date(produto.dataEntrada).toLocaleDateString()}</HideMobile>
                <td>
                  <IconWrapper>
                    <ActionButton 
                      className="view"
                      onClick={() => openDetalhesModal(produto)}
                      title="Visualizar detalhes"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </ActionButton>
                    <ActionButton 
                      className="edit"
                      onClick={() => openEdicaoModal(produto)}
                      title="Editar produto"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </ActionButton>
                    <ActionButton 
                      className="delete"
                      onClick={() => handleExcluir(produto.id)}
                      title="Excluir produto"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </ActionButton>
                    <ActionButton 
                      className="view"
                      onClick={() => openCadastrarImagemModal(produto)}
                      title="Cadastrar imagem"
                    >
                      <FontAwesomeIcon icon={faImage} />
                    </ActionButton>
                  </IconWrapper>
                </td>
              </tr>
            ))}
          </tbody>
        </ProdutosTable>
      </ProdutosTableWrapper>

      <PaginationContainer>
        <PaginationButton
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </PaginationButton>
        
        <PaginationInfo>
          Página {currentPage} de {totalPages} ({filteredProdutos.length} produtos)
        </PaginationInfo>
        
        <PaginationButton
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próxima
        </PaginationButton>
      </PaginationContainer>

      <ModalDetalhesProduto isOpen={isDetalhesModalOpen} onClose={closeModal} item={selectedItem} />
      <ModalEdicaoProduto isOpen={isEdicaoModalOpen} onClose={closeModal} item={selectedItem} onSubmit={handleSave} />
      <ModalNovoProduto isOpen={isNovoModalOpen} onClose={closeModal} onSubmit={handleSave} />
      <ModalCadastrarImagem isOpen={isCadastrarImagemModalOpen} onClose={closeModal} item={selectedItem} />
    </ProdutosContainer>
  );
};

export default Produto;
