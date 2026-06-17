import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import FormularioOrdemDeServico from '../../../Forms/FormularioOrdemDeServico';
import apiCliente from '../../../../services/apiCliente';
import { ajustarEstoquePorProdutos, buscarProdutosComEstoque, isStatusConcluido } from '../../../../services/estoque';

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: 'transparent',
    padding: '1rem',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
    maxWidth: '750px',
    width: '95%',
    maxHeight: '90vh',
    inset: 'unset',
    zIndex: 10000,
    position: 'relative',
    overflow: 'auto',
  },
};

const ModalNovaOrdemDeServico = ({ isOpen, onClose, onOrderSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [clienteOptions, setClienteOptions] = useState([]);
  const [funcionarioOptions, setFuncionarioOptions] = useState([]);
  const [produtoOptions, setProdutoOptions] = useState([]);
  const [servicoOptions, setServicoOptions] = useState([]);
  const [formData, setFormData] = useState({
    clienteID: '',
    funcionarioID: '',
    produtos: [{ produtoID: '', quantidade: 1 }],
    servicos: [{ servicoID: '', quantidade: 1 }],
    dataEntrada: '',
    dataConclusao: '',
    status: '',
    observacoes: '',
    ativo: true,
  });

  useEffect(() => {
    fetchClientes();
    fetchFuncionarios();
    fetchProdutos();
    fetchServicos();
    fetchProximoNumeroOS();
  }, [isOpen]);

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
      const funcionarios = response.data.filter(funcionario => funcionario.ativo).map(funcionario => ({
        value: funcionario.id,
        label: funcionario.nome,
      }));
      setFuncionarioOptions(funcionarios);
    } catch (error) {
      console.error('Erro ao buscar funcionÃ¡rios:', error);
    }
  };

  const fetchProdutos = async () => {
    try {
      const produtosComEstoque = await buscarProdutosComEstoque();
      // Filtra apenas produtos ativos e com quantidade > 1
      const produtos = produtosComEstoque
        .filter(produto => produto.ativo)
        .map(produto => ({
          value: produto.id,
          label: produto.nome,
          preco: produto.preco,
          quantidade: produto.quantidade // Adiciona quantidade para exibir no select
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
        preco: servico.preco, // Adiciona o preço do serviço
      }));
      setServicoOptions(servicos);
    } catch (error) {
      console.error('Erro ao buscar serviÃ§os:', error);
    }
  };

  const fetchProximoNumeroOS = async () => {
    try {
      const response = await apiCliente.get('/OrdemDeServico');
      const ordensAtivas = response.data.filter(o => o.ativo);
      
      if (ordensAtivas.length === 0) {
        // Se não houver ordens, começa com 1
        setFormData(prev => ({ ...prev, numeroOS: 1 }));
        return;
      }

      // Encontra o máximo numeroOS
      const maxNumeroOS = Math.max(...ordensAtivas.map(o => o.numeroOS || 0));
      const proximoNumero = maxNumeroOS + 1;
      
      setFormData(prev => ({ ...prev, numeroOS: proximoNumero }));
    } catch (error) {
      console.error('Erro ao buscar próximo número de OS:', error);
      // Se der erro, começa com 1
      setFormData(prev => ({ ...prev, numeroOS: 1 }));
    }
  };

  const handleSubmit = async (formData) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      console.log('Dados do formulário antes do envio:', formData);

      const dataEntrada = formData.dataEntrada ? new Date(formData.dataEntrada).toISOString() : null;
      const dataConclusao = formData.dataConclusao ? new Date(formData.dataConclusao).toISOString() : null;

      const ordemDeServicoDto = {
        id: formData.id,
        clienteID: formData.clienteID || '',
        funcionarioID: formData.funcionarioID || '',
        produtoIDs: formData.produtoIDs || [],
        servicoIDs: formData.servicoIDs || [],
        dataEntrada,
        dataConclusao,
        status: formData.status || '',
        observacoes: formData.observacoes || '',
        ativo: !!formData.ativo,
        defeitoRelatado: formData.defeitoRelatado || '',
        diagnostico: formData.diagnostico || '',
        laudoTecnico: formData.laudoTecnico || '',
        marca: formData.marca || '',
        modelo: formData.modelo || '',
        imeIouSerial: formData.imeIouSerial || '',
        senhaAcesso: formData.senhaAcesso || '',
        valorMaoDeObra: formData.valorMaoDeObra ? parseFloat(formData.valorMaoDeObra) : 0,
        valorPecas: formData.valorPecas ? parseFloat(formData.valorPecas) : 0,
        valorTotal: formData.valorTotal ? parseFloat(formData.valorTotal) : 0,
        formaPagamento: formData.formaPagamento || '',
        pago: !!formData.pago,
        dataPagamento: formData.dataPagamento || null,
        tipoAtendimento: formData.tipoAtendimento || '',
        prioridade: formData.prioridade || '',
        numeroOS: formData.numeroOS ? parseInt(formData.numeroOS) : 0,
        assinaturaClienteBase64: formData.assinaturaClienteBase64 || '',
        assinaturaTecnicoBase64: formData.assinaturaTecnicoBase64 || '',
        pecasUtilizadas: Array.isArray(formData.pecasUtilizadas)
          ? formData.pecasUtilizadas
              .filter(p => p.produtoID)
              .map(p => ({
                produtoID: p.produtoID,
                quantidade: parseInt(p.quantidade) || 1
              }))
          : [],
      };

      console.log('DTO a ser enviado:', ordemDeServicoDto);

      const response = await apiCliente.post('/OrdemDeServico', ordemDeServicoDto);
      console.log('Ordem de Serviço criada:', response.data);

      if (isStatusConcluido(formData.status)) {
        await ajustarEstoquePorProdutos(ordemDeServicoDto.pecasUtilizadas, -1);
      }

      if (onOrderSaved) {
        onOrderSaved();
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error.response ? error.response.data : error.message);
    } finally {
      setSubmitting(false);
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
        <FormularioOrdemDeServico
          title="Nova Ordem de Serviço"
          initialValues={formData}
          onSubmit={handleSubmit}
          onClose={onClose}
          submitting={submitting}
          clienteOptions={clienteOptions}
          funcionarioOptions={funcionarioOptions}
          produtoOptions={produtoOptions}
          servicoOptions={servicoOptions}
        />
      </div>
    </Modal>
  );
};

export default ModalNovaOrdemDeServico;

