import { useState, useEffect } from 'react';
import {
	OrdemDeServicoContainer as OrcamentoContainer,
	OrdemDeServicoTitle as OrcamentoTitle,
	HeaderControls,
	SearchContainer,
	SearchInput,
	PerPageSelect,
	AddButton,
	OrdemDeServicoTableWrapper as OrcamentoTableWrapper,
	OrdemDeServicoTable as OrcamentoTable,
	IconWrapper,
	ActionButton,
	PaginationContainer,
	PaginationButton,
	PaginationInfo,
	HideMobile,
	HideMobileTh,

} from './style';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEye, faEdit, faTrash, faDownload, faCheck } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
import apiCliente from '../../services/apiCliente';
import ModalDetalhesOrcamento from '../../components/Modais/Orçamento/ModalDetalhes';
import ModalEdicaoOrcamento from '../../components/Modais/Orçamento/ModalEdicao';
import ModalNovoOrcamento from '../../components/Modais/Orçamento/ModalNovo';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

Modal.setAppElement('#root');

const Orcamento = () => {
	const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
	const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
	const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [orcamentos, setOrcamentos] = useState([]);
	const [clientes, setClientes] = useState({});
	const [produtos, setProdutos] = useState({});
	const [servicos, setServicos] = useState({});
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(25);
	const [approvedOrcamentos, setApprovedOrcamentos] = useState({});

	useEffect(() => {
		fetchOrcamentos();
	}, []);

	const fetchOrcamentos = async () => {
		try {
			const response = await apiCliente.get('/OrdemDeServico');
			// Filtra apenas os registros com status 'Orçamento' e ativos
			const orcamentosAtivos = response.data.filter(orc => orc.status === 'Orçamento' && orc.ativo !== false);
			const parseDate = (d) => {
				if (!d) return new Date(0);
				const dt = new Date(d);
				if (!isNaN(dt)) return dt;
				const alt = new Date(d.replace(/-/g, '/'));
				return isNaN(alt) ? new Date(0) : alt;
			};
			const orcamentosOrdenados = [...orcamentosAtivos].sort((a, b) => parseDate(b.dataEntrada) - parseDate(a.dataEntrada));
			setOrcamentos(orcamentosOrdenados);

			const clientesIds = new Set(orcamentosAtivos.map(o => o.clienteID));
			const produtosIds = new Set();
			const servicosIds = new Set();
			orcamentosAtivos.forEach(orc => {
				if (orc.pecasUtilizadas && Array.isArray(orc.pecasUtilizadas)) {
					orc.pecasUtilizadas.forEach(produto => {
						if (produto.produtoID) produtosIds.add(produto.produtoID);
					});
				}
				if (orc.produtoIDs && Array.isArray(orc.produtoIDs)) {
					orc.produtoIDs.forEach(produtoID => {
						if (produtoID) produtosIds.add(produtoID);
					});
				}
				if (orc.produtos && Array.isArray(orc.produtos)) {
					orc.produtos.forEach(produto => {
						if (produto.produtoID) produtosIds.add(produto.produtoID);
					});
				}
				if (orc.servicoIDs && Array.isArray(orc.servicoIDs)) {
					orc.servicoIDs.forEach(servicoID => {
						if (servicoID) servicosIds.add(servicoID);
					});
				}
				if (orc.servicos && Array.isArray(orc.servicos)) {
					orc.servicos.forEach(servico => {
						if (servico.servicoID) servicosIds.add(servico.servicoID);
					});
				}
			});
			await Promise.all([
				fetchMap(clientesIds, clientes, '/Cliente/', setClientes),
				fetchMap(produtosIds, produtos, '/Produto/', setProdutos),
				fetchMap(servicosIds, servicos, '/Servico/', setServicos),
			]);
		} catch (error) {
			console.error('Erro ao buscar orçamentos:', error);
		}
	};

	const fetchMap = async (ids, existing, endpoint, setState) => {
		const dataMap = {};
		await Promise.all(Array.from(ids).map(async id => {
			if (!existing[id]) {
				const response = await apiCliente.get(`${endpoint}${id}`);
				dataMap[id] = response.data;
			}
		}));
		setState(prev => ({ ...prev, ...dataMap }));
	};

	const handleExcluir = async (id) => {
		if (window.confirm('Deseja excluir este orçamento?')) {
			try {
				await apiCliente.put(`/OrdemDeServico/desativar/${id}`);
				fetchOrcamentos();
				alert('Orçamento excluído com sucesso!');
			} catch (error) {
				console.error('Erro ao excluir orçamento:', error);
			}
		}
	};

	const handleAprovarOrcamento = async (id) => {
		try {
			const orc = orcamentos.find(o => o.id === id);
			if (orc) {
				const dataToSend = { ...orc, status: 'Não iniciado' };
				await apiCliente.put(`/OrdemDeServico/${id}`, dataToSend);
				setApprovedOrcamentos(prev => ({ ...prev, [id]: true }));
				fetchOrcamentos();
			}
		} catch (error) {
			console.error('Erro ao aprovar orçamento:', error);
			alert('Erro ao aprovar o orçamento');
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
		fetchOrcamentos();
	};

	const handleSave = async (formData) => {
		try {
			// Garante que o status seja 'Orçamento' ao criar ou editar
			const dataToSend = { ...formData, status: 'Orçamento' };
			if (formData.id) {
				await apiCliente.put(`/OrdemDeServico/${formData.id}`, dataToSend);
			} else {
				await apiCliente.post('/OrdemDeServico', dataToSend);
			}
			fetchOrcamentos();
			closeModal();
		} catch (error) {
			console.error('Erro ao salvar orçamento:', error);
		}
	};

	const handleExport = async () => {
		try {
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Orcamentos');
			
			if (filteredOrcamentos.length === 0) {
				worksheet.addRow(['Nenhum orçamento para exportar']);
			} else {
				const headers = Object.keys(filteredOrcamentos[0]);
				worksheet.addRow(headers);
				filteredOrcamentos.forEach(orcamento => {
					worksheet.addRow(Object.values(orcamento));
				});
			}
			
			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
			saveAs(blob, 'orcamentos.xlsx');
		} catch (error) {
			console.error('Erro ao exportar orçamentos:', error);
			alert('Erro ao exportar orçamentos para Excel');
		}
	};

	const getClienteNome = (clienteID) => {
		const cliente = clientes[clienteID];
		return cliente?.nome || cliente || '';
	};

	const filteredOrcamentos = orcamentos.filter(orc => {
		const clienteNome = getClienteNome(orc.clienteID).toLowerCase();
		const termo = searchTerm.toLowerCase();
		return clienteNome.includes(termo);
	});

	const totalPages = Math.ceil(filteredOrcamentos.length / itemsPerPage);
	const paginatedOrcamentos = filteredOrcamentos.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const formatDate = (dateStr) => {
		if (!dateStr) return '--/--/----';
		const d = new Date(dateStr);
		const localDate = new Date(d.getTime() + Math.abs(d.getTimezoneOffset()) * 60000);
		return localDate.toLocaleDateString('pt-BR');
	};

	return (
		<OrcamentoContainer>
			<>
				<div style={{ position: 'relative', marginBottom: '16px' }}>
					<OrcamentoTitle>
						Orçamentos
					</OrcamentoTitle>
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
							placeholder="Buscar cliente..."
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
						Novo Orçamento
					</AddButton>
				</HeaderControls>

				<OrcamentoTableWrapper>
					<OrcamentoTable>
						<thead>
							<tr>
								<th>Cliente</th>
								<HideMobileTh>Entrada</HideMobileTh>
								<th style={{ textAlign: 'center' }}>Ações</th>
							</tr>
						</thead>
						<tbody>
							{paginatedOrcamentos.map(orc => (
								<tr key={orc.id}>
									<td>{getClienteNome(orc.clienteID)}</td>
									<HideMobile>{formatDate(orc.dataEntrada)}</HideMobile>
									<td>
										<IconWrapper>
											<ActionButton
												className="view"
												onClick={() => openDetalhesModal(orc)}
												title="Visualizar detalhes"
											>
												<FontAwesomeIcon icon={faEye} />
											</ActionButton>
											<ActionButton
												className={approvedOrcamentos[orc.id] ? 'approve-active' : 'approve'}
												onClick={() => handleAprovarOrcamento(orc.id)}
												title="Aprovar orçamento"
											>
												<FontAwesomeIcon icon={faCheck} />
											</ActionButton>
											<ActionButton
												className="edit"
												onClick={() => openEdicaoModal(orc)}
												title="Editar orçamento"
											>
												<FontAwesomeIcon icon={faEdit} />
											</ActionButton>
											<ActionButton
												className="delete"
												onClick={() => handleExcluir(orc.id)}
												title="Excluir orçamento"
											>
												<FontAwesomeIcon icon={faTrash} />
											</ActionButton>
										</IconWrapper>
									</td>
								</tr>
							))}
						</tbody>
					</OrcamentoTable>
				</OrcamentoTableWrapper>

				<PaginationContainer>
					<PaginationButton
						onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
						disabled={currentPage === 1}
					>
						Anterior
					</PaginationButton>

					<PaginationInfo>
						Página {currentPage} de {totalPages} ({filteredOrcamentos.length} orçamentos)
					</PaginationInfo>

					<PaginationButton
						onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
						disabled={currentPage === totalPages}
					>
						Próxima
					</PaginationButton>
				</PaginationContainer>

				<ModalDetalhesOrcamento
					isOpen={isDetalhesModalOpen}
					onClose={closeModal}
					item={selectedItem}
					cliente={selectedItem ? getClienteNome(selectedItem.clienteID) : ''}
					produtos={produtos}
					servicos={servicos}
				/>
				<ModalEdicaoOrcamento isOpen={isEdicaoModalOpen} onClose={closeModal} item={selectedItem} onSubmit={handleSave} />
				<ModalNovoOrcamento isOpen={isNovoModalOpen} onClose={closeModal} onSubmit={handleSave} />
			</>
		</OrcamentoContainer>
	);
};

export default Orcamento;
