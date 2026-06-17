import styled from 'styled-components';

export const OrdemDeServicoContainer = styled.div`
  padding: 2rem 3rem;
  padding-bottom: 3rem;
  min-height: 77.8vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  transition: all 0.3s ease;
  position: relative;
  
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 100px 100px, rgba(108, 117, 125, 0.02) 1px, transparent 1px),
      radial-gradient(circle at 300px 200px, rgba(173, 181, 189, 0.015) 1px, transparent 1px);
    background-size: 200px 200px, 400px 400px;
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: 800px) {
    padding: 1.5rem 2rem;
  }

  @media (max-width: 600px) {
    padding: 1rem;
  }

  @media (max-width: 450px) {
    padding: 0.75rem;
  }
`;

export const OrdemDeServicoTitle = styled.h2`
  margin: 0 0 2rem 0;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #2c3e50;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.5px;
  position: relative;
  text-align: left;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #007bff, #0056b3);
    border-radius: 2px;
  }
`;

export const HeaderControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

export const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid rgba(108, 117, 125, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 250px;
  
  &::placeholder {
    color: #6c757d;
    font-weight: 400;
  }
  
  &:focus {
    outline: none;
    border-color: #007bff;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    min-width: unset;
  }
`;

export const PerPageSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid rgba(108, 117, 125, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 160px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    transform: translateY(-1px);
  }

  option {
    background: white;
    color: #2c3e50;
    padding: 0.5rem;
  }

  @media (max-width: 640px) {
    min-width: unset;
    width: 100%;
  }
`;

export const SelectStatus = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid rgba(108, 117, 125, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 180px;
  margin-left: 1rem;

  &:focus {
    outline: none;
    border-color: #007bff;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    transform: translateY(-1px);
  }

  option {
    background: white;
    color: #2c3e50;
    padding: 0.5rem;
  }

  @media (max-width: 640px) {
    min-width: unset;
    width: 100%;
    margin-left: 0;
  }
`;

export const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #28a745, #20c997);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
  
  &:hover {
    background: linear-gradient(135deg, #20c997, #17a2b8);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
  }
  
  &:active {
    transform: translateY(-1px);
  }

  svg {
    font-size: 1.1rem;
  }

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
`;

export const OrdemDeServicoTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
`;

export const OrdemDeServicoTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.95rem;

  th {
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    color: white;
    font-weight: 600;
    text-align: left;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    position: sticky;
    top: 0;
    z-index: 10;
    
    &:first-child {
      border-top-left-radius: 16px;
    }
    
    &:last-child {
      border-top-right-radius: 16px;
    }
  }

  td {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(108, 117, 125, 0.1);
    color: #2c3e50;
    font-weight: 500;
    vertical-align: middle;
    transition: all 0.2s ease;
  }

  tbody tr {
    background: rgba(255, 255, 255, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:nth-child(even) {
      background: rgba(248, 249, 250, 0.8);
    }
    
    &:hover {
      background: rgba(0, 123, 255, 0.05);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
      
      td {
        color: #1a202c;
      }
    }
    
    &:last-child td {
      &:first-child {
        border-bottom-left-radius: 14px;
      }
      
      &:last-child {
        border-bottom-right-radius: 14px;
      }
    }
  }

  @media (max-width: 750px) {
    th,
    td {
      font-size: 0.85rem;
      padding: 0.75rem;
    }
  }

  @media (max-width: 550px) {
    th,
    td {
      font-size: 0.8rem;
      padding: 0.5rem;
    }
  }
`;

export const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  
  svg {
    width: 14px !important;
    height: 14px !important;
    color: white;
  }
  
  &.view {
    background: linear-gradient(135deg, #17a2b8, #138496);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #138496, #117a8b);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
    }
  }
  
  &.edit {
    background: linear-gradient(135deg, #ffc107, #e0a800);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #e0a800, #d39e00);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
    }
  }
  
  &.delete {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #c82333, #bd2130);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }
  }
  
  &.approve {
    background: linear-gradient(135deg, #6c757d, #5a6268);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #5a6268, #4e555b);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
    }
  }
  
  &.approve-active {
    background: linear-gradient(135deg, #28a745, #218838);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #218838, #1e7e34);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

export const PaginationButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 10px;
  background: ${props => props.disabled 
    ? 'rgba(108, 117, 125, 0.2)' 
    : 'linear-gradient(135deg, #007bff, #0056b3)'
  };
  color: ${props => props.disabled ? 'rgba(108, 117, 125, 0.6)' : 'white'};
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0056b3, #004085);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(-1px);
  }
`;

export const PaginationInfo = styled.span`
  font-weight: 600;
  color: #2c3e50;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(108, 117, 125, 0.1);
`;

export const BotaoEspacamento = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    justify-content: center;
    width: 100%;
  }
`;

export const OrdemDeServicoButton = styled.button`
  margin-right: 5px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);

  &:hover {
    background: linear-gradient(135deg, #0056b3, #004085);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }

  @media (max-width: 600px) {
    width: 100%;
    margin: 5px 0;
    padding: 12px;
  }
`;
export const HideMobile = styled.td`
    @media (max-width: 700px) {
        display: none !important;
    }
`;

export const HideMobileTh = styled.th`
    @media (max-width: 700px) {
        display: none !important;
    }
`;
