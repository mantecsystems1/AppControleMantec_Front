import React, { useState, useEffect } from 'react';
import {
  FormContainer,
  FormTitle,
  Form,
  FormRow,
  FormGroup,
  Label,
  Input,
  EspacamentoButton,
  Button
} from './style';

const FormularioProduto = ({ initialValues, onSubmit, onClose, modalTitle, produtoOptions }) => {
  const [formData, setFormData] = useState({ ...initialValues });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Atualiza o estado do formulário quando initialValues mudar
    setFormData({ ...initialValues });
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selectedOption, name) => {
    setFormData({ ...formData, [name]: selectedOption ? selectedOption.value : '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nome) newErrors.nome = 'Informe o nome.';
    if (!formData.fornecedor) newErrors.fornecedor = 'Informe o fornecedor.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { quantidade, estoqueId, estoque, ...produtoData } = formData;
    onSubmit({
      ...produtoData,
      preco: Number(produtoData.preco) || 0,
      dataEntrada: produtoData.dataEntrada || new Date().toISOString(),
      ativo: true,
    });
  };

  // Supondo que produtoOptions seja passado como prop e cada produto tem { value, label, quantidade, ... }
  const filteredProdutoOptions = (produtoOptions || []).filter(opt => Number(opt.quantidade) > 1).map(opt => ({
    ...opt,
    label: (
      <span>
        {opt.label}
        <span style={{ color: 'green', marginLeft: 8, fontWeight: 600 }}>
          ({opt.quantidade} em estoque)
        </span>
      </span>
    )
  }));

  if (!initialValues) return null; // Adiciona um fallback para evitar renderização sem initialValues

  return (
    <FormContainer>
      <FormTitle>{modalTitle || 'Formulário de Produto'}</FormTitle>
      <Form onSubmit={handleSubmit}>
        <FormRow>
          <FormGroup delay="0.1s">
            <Label htmlFor="imagemURL">URL da Imagem</Label>
            <Input 
              type="text" 
              id="imagemURL" 
              name="imagemURL" 
              value={formData.imagemURL || ''} 
              onChange={handleChange}
              placeholder="Digite a URL da imagem"
            />
          </FormGroup>
          
          <FormGroup delay="0.2s">
            <Label htmlFor="nome">Nome do Produto <span style={{color:'red'}}>*</span></Label>
            <Input 
              type="text" 
              id="nome" 
              name="nome" 
              value={formData.nome || ''} 
              onChange={handleChange} 
              placeholder="Digite o nome do produto"
              required 
            />
            {errors.nome && <div style={{color:'red',fontSize:'12px'}}>{errors.nome}</div>}
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup delay="0.3s">
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input 
              type="number" 
              step="0.01"
              min="0"
              id="preco" 
              name="preco" 
              value={formData.preco || ''} 
              onChange={handleChange}
              placeholder="0,00"
            />
            {errors.preco && <div style={{color:'red',fontSize:'12px'}}>{errors.preco}</div>}
          </FormGroup>

          <FormGroup delay="0.4s">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input 
              type="number" 
              min="0"
              id="quantidade" 
              name="quantidade" 
              value={formData.quantidade || ''} 
              onChange={handleChange}
              placeholder="Digite a quantidade"
              disabled
            />
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup delay="0.5s">
            <Label htmlFor="fornecedor">Fornecedor <span style={{color:'red'}}>*</span></Label>
            <Input 
              type="text" 
              id="fornecedor" 
              name="fornecedor" 
              value={formData.fornecedor || ''} 
              onChange={handleChange}
              placeholder="Digite o fornecedor"
              required 
            />
            {errors.fornecedor && <div style={{color:'red',fontSize:'12px'}}>{errors.fornecedor}</div>}
          </FormGroup>

          <FormGroup delay="0.6s">
            <Label htmlFor="dataEntrada">Data de Entrada</Label>
            <Input 
              type="date" 
              id="dataEntrada" 
              name="dataEntrada" 
              value={formData.dataEntrada || ''} 
              onChange={handleChange} 
              required 
            />
          </FormGroup>
        </FormRow>

        <FormGroup delay="0.7s">
          <Label htmlFor="descricao">Descrição</Label>
          <Input 
            as="textarea"
            rows="2"
            id="descricao" 
            name="descricao" 
            value={formData.descricao || ''} 
            onChange={handleChange}
            placeholder="Digite uma descrição detalhada do produto"
            style={{ resize: 'vertical', minHeight: '50px' }}
            required 
          />
        </FormGroup>
        <EspacamentoButton>
          <Button type="submit" className="save">
            Salvar
          </Button>
          <Button type="button" className="cancel" onClick={onClose}>
            Cancelar
          </Button>
        </EspacamentoButton>
      </Form>
    </FormContainer>
  );
};

export default FormularioProduto;
