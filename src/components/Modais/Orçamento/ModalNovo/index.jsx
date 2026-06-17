import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import FormularioOrcamento from '../../../Forms/FormularioOrcamento';
import apiCliente from '../../../../services/apiCliente';
import { buscarProdutosComEstoque } from '../../../../services/estoque';
import { modalStyles } from './style';

const ModalNovoOrcamento = ({ isOpen, onClose }) => {
	const [clienteOptions, setClienteOptions] = useState([]);
	const [produtoOptions, setProdutoOptions] = useState([]);
	const [servicoOptions, setServicoOptions] = useState([]);
	const [funcionarioPadraoID, setFuncionarioPadraoID] = useState('');
	const [formData, setFormData] = useState({
		clienteID: '',
		produtos: [{ produtoID: '', quantidade: 1 }],
		servicos: [{ servicoID: '', quantidade: 1 }],
		defeitoRelatado: '',
		diagnostico: '',
		observacoes: '',
		status: 'Orçamento',
		dataValidade: '',
		aceiteCliente: false,
		dataEntrada: '',
		valorMaoDeObra: 0,
		valorServicos: 0,
		valorPecas: 0,
		valorTotal: 0,
	});

	useEffect(() => {
		fetchClientes();
		fetchFuncionarios();
		fetchProdutos();
		fetchServicos();
	}, []);

	const fetchClientes = async () => {
		try {
			const response = await apiCliente.get('/Cliente');
			const clientes = response.data.filter(cliente => cliente.ativo).map(cliente => ({
				value: cliente.id,
				label: cliente.nome,
			}));
			setClienteOptions(clientes);
		} catch (error) {
			console.error('Erro ao buscar clientes:', error);
		}
	};

	const fetchFuncionarios = async () => {
		try {
			const response = await apiCliente.get('/Funcionario');
			const funcionario = response.data.find(item => item.ativo);
			setFuncionarioPadraoID(funcionario?.id || '');
		} catch (error) {
			console.error('Erro ao buscar funcionários:', error);
		}
	};

	const fetchProdutos = async () => {
		try {
			const produtosComEstoque = await buscarProdutosComEstoque();
			const produtos = produtosComEstoque
				.filter(produto => produto.ativo)
				.map(produto => ({
					value: produto.id,
					label: produto.nome,
					preco: produto.preco,
					quantidade: produto.quantidade
				}));
			setProdutoOptions(produtos);
		} catch (error) {
			console.error('Erro ao buscar produtos:', error);
		}
	};

	const fetchServicos = async () => {
		try {
			const response = await apiCliente.get('/Servico');
			const servicos = response.data.filter(servico => servico.ativo).map(servico => ({
				value: servico.id,
				label: servico.nome,
				preco: servico.preco,
			}));
			setServicoOptions(servicos);
		} catch (error) {
			console.error('Erro ao buscar serviços:', error);
		}
	};

	const handleSubmit = async (formData) => {
		try {
			const payload = {
				clienteID: formData.clienteID,
				funcionarioID: funcionarioPadraoID,
				produtoIDs: formData.produtos.filter(p => p.produtoID).map(p => p.produtoID),
				servicoIDs: formData.servicos.filter(s => s.servicoID).map(s => s.servicoID),
				dataEntrada: formData.dataEntrada ? new Date(formData.dataEntrada).toISOString() : new Date().toISOString(),
				dataConclusao: null,
				status: 'Orçamento',
				observacoes: formData.observacoes,
				ativo: true,
				defeitoRelatado: formData.defeitoRelatado,
				diagnostico: formData.diagnostico,
				laudoTecnico: null,
				marca: null,
				modelo: null,
				imeIouSerial: null,
				senhaAcesso: null,
				emGarantia: false,
				dataGarantia: null,
				valorMaoDeObra: Number(formData.valorMaoDeObra) || 0,
				valorPecas: Number(formData.valorPecas) || 0,
				valorTotal: Number(formData.valorTotal) || 0,
				formaPagamento: null,
				pago: false,
				tipoAtendimento: null,
				prioridade: null,
				assinaturaClienteBase64: null,
				assinaturaTecnicoBase64: null,
				pecasUtilizadas: formData.produtos.filter(p => p.produtoID).map(p => ({
					produtoID: p.produtoID,
					quantidade: p.quantidade
				}))
			};

			await apiCliente.post('/OrdemDeServico', payload);
			onClose();
		} catch (error) {
			console.error('Erro ao salvar orçamento:', error.response ? error.response.data : error.message);
			alert('Erro ao salvar orçamento. Verifique o console para mais detalhes.');
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			overlayElement={(props, contentElement) => (
				<div {...props}>{contentElement}</div>
			)}
			contentElement={(props, children) => (
				<div {...props}>{children}</div>
			)}
			style={modalStyles}
		>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<FormularioOrcamento
					title="Novo Orçamento"
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

export default ModalNovoOrcamento;
