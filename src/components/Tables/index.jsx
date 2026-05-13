// src/components/Tables/index.jsx
import React from 'react';
import styled from 'styled-components';

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const TableContainer = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: white;

  @media (max-width: 768px) {
    display: block;
    width: 100%;
    margin-top: 12px;
  }
`;

const Th = styled.th`
  padding: 12px 10px;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Td = styled.td`
  padding: 12px 10px;
  border: 1px solid #dee2e6;
  color: #495057;
  font-size: 0.9rem;
  vertical-align: middle;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: none;
    border-bottom: 1px solid #e9ecef;
    padding: 10px 8px;

    &::before {
      content: attr(data-label);
      font-weight: 600;
      color: #6c757d;
      flex: 1;
      min-width: 120px;
    }
  }
`;

const Tr = styled.tr`
  &:hover {
    background-color: #f1f3f4;
  }

  @media (max-width: 768px) {
    display: block;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 12px;
    background: white;

    &:hover {
      background-color: #ffffff;
    }
  }
`;

const Table = ({ columns = [], data = [], initialPageSize = 10 }) => {
  // Se não há colunas definidas, usar layout padrão (compatibilidade)
  if (columns.length === 0) {
    return (
      <TableWrapper>
        <TableContainer>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Nome</Th>
              <Th>Endereco</Th>
              <Th>Telefone</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <Tr key={item.id || index}>
                <Td data-label="ID">{item.id}</Td>
                <Td data-label="Nome">{item.nome}</Td>
                <Td data-label="Endereco">{item.endereco}</Td>
                <Td data-label="Telefone">{item.telefone}</Td>
              </Tr>
            ))}
          </tbody>
        </TableContainer>
      </TableWrapper>
    );
  }

  // Layout dinâmico baseado nas colunas
  return (
    <TableWrapper>
      <TableContainer>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <Th key={index}>
                {column.Header}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, initialPageSize).map((row, rowIndex) => (
            <Tr key={row.id || rowIndex}>
              {columns.map((column, colIndex) => {
                const cellValue = column.accessor 
                  ? (typeof column.accessor === 'function' 
                      ? column.accessor(row) 
                      : row[column.accessor])
                  : '';
                const headerLabel = typeof column.Header === 'string' ? column.Header : '';
                
                return (
                  <Td key={colIndex} data-label={headerLabel}>
                    {column.Cell 
                      ? column.Cell({ row: { original: row }, value: cellValue })
                      : cellValue
                    }
                  </Td>
                );
              })}
            </Tr>
          ))}
        </tbody>
      </TableContainer>
    </TableWrapper>
  );
};

export default Table;



