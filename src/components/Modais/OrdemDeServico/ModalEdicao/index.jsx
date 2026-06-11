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

const ModalEdicaoOrdemDeServico = ({ isOpen, onClose, item, onOrderSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    clienteID: '',
    funcionarioID: '',
    produtos: [{ produtoID: '', quantidade: 1 }],
    servicos: [{ servicoID: '', quantidade: 1 }],
    dataEntrada: '',
    dataConclusao: '',
    status: '',
    observacoes: '',
    ativo: true,
    diagnostico: '',
    laudoTecnico: '',
    marca: '',
    modelo: '',
    imeIouSerial: '',
    senhaAcesso: '',
    emGarantia: '',
    dataGarantia: '',
    valorMaoDeObra: 0, // Inicializa como 0 para garantir tipo consistente
    valorPecas: 0,
    defeitoRelatado: '',
    valorTotal: 0,
    formaPagamento: '',
    pago: false,
    tipoAtendimento: '',
    prioridade: '',
    numeroOS: 0,
    assinaturaClienteBase64: '',
    assinaturaTecnicoBase64: '',
    pecasUtilizadas: [],
  });

  const [clienteOptions, setClienteOptions] = useState([]);
  const [funcionarioOptions, setFuncionarioOptions] = useState([]);
  const [produtoOptions, setProdutoOptions] = useState([]);
  const [servicoOptions, setServicoOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientes = await apiCliente.get('/Cliente');
        const funcionarios = await apiCliente.get('/Funcionario');
        const produtos = await buscarProdutosComEstoque();
        const servicos = await apiCliente.get('/Servico');

        setClienteOptions(clientes.data.filter(c => c.ativo).map(c => ({ value: c.id, label: c.nome })));
        setFuncionarioOptions(funcionarios.data.filter(f => f.ativo).map(f => ({ value: f.id, label: f.nome })));
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
      const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().slice(0, 10) : '';

      let produtos = [{ produtoID: '', quantidade: 1 }];
      let servicos = [{ servicoID: '', quantidade: 1 }];

      // Produtos
      if (item.pecasUtilizadas?.length > 0) {
        produtos = item.pecasUtilizadas.map(p => ({
          produtoID: p.produtoID,
          quantidade: p.quantidade || 1
        }));
      } else if (item.produtoIDs?.length > 0) {
        produtos = item.produtoIDs.map(id => ({
          produtoID: id,
          quantidade: 1
        }));
      }

      // Serviços
      if (item.servicoIDs?.length > 0) {
        servicos = item.servicoIDs.map(id => ({
          servicoID: id,
          quantidade: 1
        }));
      }

      setFormData({
        id: item.id || '',
        clienteID: item.clienteID || '',
        funcionarioID: item.funcionarioID || '',
        produtos,
        servicos,
        dataEntrada: formatDate(item.dataEntrada),
        dataConclusao: formatDate(item.dataConclusao),
        status: item.status || '',
        observacoes: item.observacoes || '',
        ativo: item.ativo ?? true,
        diagnostico: item.diagnostico || '',
        laudoTecnico: item.laudoTecnico || '',
        marca: item.marca || '',
        modelo: item.modelo || '',
        imeIouSerial: item.imeIouSerial || '',
        senhaAcesso: item.senhaAcesso || '',
        emGarantia: item.emGarantia || '',
        dataGarantia: formatDate(item.dataGarantia),
        valorMaoDeObra: item.valorMaoDeObra !== undefined && item.valorMaoDeObra !== null
          ? String(item.valorMaoDeObra)
          : '0', // Garante que seja string para o input
        valorPecas: item.valorPecas || 0,
        defeitoRelatado: item.defeitoRelatado || '',
        valorTotal: item.valorTotal || 0,
        formaPagamento: item.formaPagamento || '',
        pago: item.status === 'Entregue' ? true : (item.pago || false),
        tipoAtendimento: item.tipoAtendimento || '',
        prioridade: item.prioridade || '',
        numeroOS: item.numeroOS || 0,
        assinaturaClienteBase64: item.assinaturaClienteBase64 || '',
        assinaturaTecnicoBase64: item.assinaturaTecnicoBase64 || '',
        pecasUtilizadas: item.pecasUtilizadas || [],
      });
    }
  }, [item, isOpen]);
  const handleSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      console.log('Dados do formulário de edição antes do envio:', data);

      const oldStatus = item.status;
      const newStatus = data.status;
      const oldConcluido = isStatusConcluido(oldStatus);
      const newConcluido = isStatusConcluido(newStatus);

      // Ao preparar os dados para envio:
      const dataEntradaFormatada = data.dataEntrada ? new Date(data.dataEntrada).toISOString().slice(0, 10) : null;
      const dataConclusaoFormatada = data.dataConclusao ? new Date(data.dataConclusao).toISOString().slice(0, 10) : null;

      const ordemData = {
        ...data,
        dataEntrada: dataEntradaFormatada,
        dataConclusao: dataConclusaoFormatada,
      };

      await apiCliente.put(`/OrdemDeServico/${ordemData.id}`, ordemData);

      if (oldConcluido && !newConcluido) {
        await ajustarEstoquePorProdutos(data.pecasUtilizadas, 1);
      }

      if (!oldConcluido && newConcluido) {
        await ajustarEstoquePorProdutos(data.pecasUtilizadas, -1);
      }

      onOrderSaved(); // Notify parent to refresh
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error);
    } finally {
      setSubmitting(false);
      onClose(); // Close modal after successful save or error
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
        <FormularioOrdemDeServico
          title="Editar Ordem de Serviço"
          initialValues={formData} // Todos os campos, inclusive valorMaoDeObra, são passados corretamente
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

export default ModalEdicaoOrdemDeServico;
