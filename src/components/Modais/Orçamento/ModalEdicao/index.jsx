import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import FormularioOrcamento from '../../../Forms/FormularioOrcamento';
import apiCliente from '../../../../services/apiCliente';
import { buscarProdutosComEstoque } from '../../../../services/estoque';
import { modalStyles } from '../ModalNovo/style';

const ModalEdicaoOrcamento = ({ isOpen, onClose, item, onSubmit }) => {
	const [formData, setFormData] = useState({
		id: '',
		clienteID: '',
		produtos: [{ produtoID: '', quantidade: 1 }],
		servicos: [{ servicoID: '', quantidade: 1 }],
		defeitoRelatado: '',
		diagnostico: '',
		observacoes: '',
		status: '',
		dataValidade: '',
		aceiteCliente: false,
		dataEntrada: '',
		valorMaoDeObra: 0,
		valorServicos: 0,
		valorPecas: 0,
		valorTotal: 0,
	});

	const [clienteOptions, setClienteOptions] = useState([]);
	const [produtoOptions, setProdutoOptions] = useState([]);
	const [servicoOptions, setServicoOptions] = useState([]);
	const [funcionarioPadraoID, setFuncionarioPadraoID] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const clientes = await apiCliente.get('/Cliente');
				const funcionarios = await apiCliente.get('/Funcionario');
				const produtos = await buscarProdutosComEstoque();
				const servicos = await apiCliente.get('/Servico');

				setClienteOptions(clientes.data.filter(c => c.ativo).map(c => ({ value: c.id, label: c.nome })));
				setFuncionarioPadraoID(funcionarios.data.find(f => f.ativo)?.id || '');
				setProdutoOptions(
					produtos
						.filter(p => p.ativo)
						.map(p => ({
							value: p.id,
							label: p.nome,
							preco: p.preco,
							quantidade: p.quantidade
						}))
				);
				setServicoOptions(servicos.data.map(s => ({
					value: s.id,
					label: s.nome,
					preco: s.preco,
					ativo: s.ativo
				})));
			} catch (error) {
				console.error('Erro ao buscar dados:', error);
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		if (item) {
			const loadData = async () => {
				let dados = item;
				// Busca os dados completos da API para garantir que temos os arrays de produtos/serviços
				if (item.id) {
					try {
						const response = await apiCliente.get(`/OrdemDeServico/${item.id}`);
						dados = response.data;
					} catch (error) {
						console.error('Erro ao buscar detalhes da OS:', error);
					}
				}

				const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().slice(0, 10) : '';

				let produtos = [{ produtoID: '', quantidade: 1 }];
				let servicos = [{ servicoID: '', quantidade: 1 }];

				// Mapeamento de Produtos (pecasUtilizadas > produtoIDs > produtos)
				if (dados.pecasUtilizadas?.length > 0) {
					produtos = dados.pecasUtilizadas.map(p => ({
						produtoID: p.produtoID,
						quantidade: p.quantidade || 1
					}));
				} else if (dados.produtoIDs?.length > 0) {
					produtos = dados.produtoIDs.map(id => ({
						produtoID: id,
						quantidade: 1
					}));
				} else if (dados.produtos?.length > 0) {
					produtos = dados.produtos.map(p => ({
						produtoID: p.produtoID,
						quantidade: p.quantidade || 1
					}));
				}

				// Mapeamento de Serviços (servicoIDs > servicos)
				if (dados.servicoIDs?.length > 0) {
					servicos = dados.servicoIDs.map(id => ({
						servicoID: id,
						quantidade: 1
					}));
				} else if (dados.servicos?.length > 0) {
					servicos = dados.servicos.map(s => ({
						servicoID: s.servicoID,
						quantidade: s.quantidade || 1
					}));
				}

				setFormData({
					id: dados.id || '',
					clienteID: dados.clienteID || '',
					produtos,
					servicos,
					defeitoRelatado: dados.defeitoRelatado || '',
					diagnostico: dados.diagnostico || '',
					observacoes: dados.observacoes || '',
					status: dados.status || '',
					dataValidade: formatDate(dados.dataValidade),
					aceiteCliente: !!dados.aceiteCliente,
					dataEntrada: formatDate(dados.dataEntrada),
					valorMaoDeObra: dados.valorMaoDeObra ?? 0,
					valorServicos: dados.valorServicos ?? 0,
					valorPecas: dados.valorPecas ?? 0,
					valorTotal: dados.valorTotal ?? 0,
				});
			};
			loadData();
		}
	}, [item, isOpen]);

	const handleSubmit = async (data) => {
		try {
			// Prepara o payload no formato correto para OrdemDeServico
			const payload = {
				id: data.id,
				clienteID: data.clienteID,
				funcionarioID: data.funcionarioID || funcionarioPadraoID,
				produtoIDs: data.produtos.filter(p => p.produtoID).map(p => p.produtoID),
				servicoIDs: data.servicos.filter(s => s.servicoID).map(s => s.servicoID),
				dataEntrada: data.dataEntrada ? new Date(data.dataEntrada).toISOString() : new Date().toISOString(),
				dataConclusao: null,
				status: data.status || 'Orçamento',
				observacoes: data.observacoes || '',
				ativo: true,
				defeitoRelatado: data.defeitoRelatado || '',
				diagnostico: data.diagnostico || '',
				laudoTecnico: null,
				marca: null,
				modelo: null,
				imeIouSerial: null,
				senhaAcesso: null,
				pecasUtilizadas: data.produtos.filter(p => p.produtoID).map(p => ({
					produtoID: p.produtoID,
					quantidade: p.quantidade
				})),
				valorMaoDeObra: Number(data.valorMaoDeObra) || 0,
				valorPecas: Number(data.valorPecas) || 0,
				valorTotal: Number(data.valorTotal) || 0,
				formaPagamento: null,
				pago: false,
				tipoAtendimento: null,
				prioridade: null,
				assinaturaClienteBase64: null,
				assinaturaTecnicoBase64: null,
			};
			await onSubmit(payload);
			onClose();
		} catch (error) {
			console.error('Erro ao salvar orçamento:', error);
		}
	};

	if (!item) return null;

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			overlayElement={(props, contentElement) => <div {...props}>{contentElement}</div>}
			contentElement={(props, children) => <div {...props}>{children}</div>}
			style={modalStyles}
		>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<FormularioOrcamento
					title="Editar Orçamento"
					initialData={formData}
					onSubmit={handleSubmit}
					onClose={onClose}
					clienteOptions={clienteOptions}
					produtoOptions={produtoOptions}
					servicoOptions={servicoOptions}
				/>
			</div>
		</Modal>
	);
};

export default ModalEdicaoOrcamento;
