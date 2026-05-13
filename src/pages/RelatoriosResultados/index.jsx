import React, { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Controls,
  DateInput,
  KPIsGrid,
  KpiCard,
  Section,
  SectionHeader,
  SectionBody,
  ExportButtons,
  TableWrapper,
  StyledTable,
  ChartExportBtn
} from './style';

import apiCliente from '../../services/apiCliente';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
        <p className="label">{`${label} : R$ ${payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</p>
      </div>
    );
  }

  return null;
};

const RelatoriosResultados = () => {
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');

  // Generate last 12 months for the dropdown
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`,
    };
  });

  useEffect(() => {
    // fetch initial summary (today)
    fetchResumo();
  }, []);

  const handleMonthChange = (e) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue);

    if (monthValue) {
      const [year, month] = monthValue.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Day 0 of next month is last day of current

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      setRangeStart(startDateStr);
      setRangeEnd(endDateStr);
      fetchResumo(startDateStr, endDateStr);
    } else {
      // "Todos os Períodos" selected
      setRangeStart('');
      setRangeEnd('');
      fetchResumo();
    }
  };
  
  const fetchResumo = async (start, end) => {
    setLoading(true);
    try {
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;

      const [ordensResp, clientesResp, produtosResp, servicosResp, funcionariosResp, estoqueResp] = await Promise.all([
        apiCliente.get('/OrdemDeServico'),
        apiCliente.get('/Cliente'),
        apiCliente.get('/Produto'),
        apiCliente.get('/Servico'),
        apiCliente.get('/Funcionario'),
        apiCliente.get('/Estoque')
      ]);

      const ordens = ordensResp.data || [];
      const clientes = clientesResp.data || [];
      const produtos = produtosResp.data || [];
      const servicos = servicosResp.data || [];
      const funcionarios = funcionariosResp.data || [];
      const estoque = estoqueResp.data || [];

      const startDate = start ? new Date(start + 'T00:00:00') : null;
      const endDate = end ? new Date(end + 'T23:59:59') : null;

      const inRange = (iso) => {
        if (!iso) return false;
        const d = new Date(iso);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      };

      const today = new Date();
      const isSameDay = (iso) => {
        if (!iso) return false;
        const d = new Date(iso);
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      };

      // Filter orders by range if provided
      const ordensFiltradas = (startDate || endDate) ? ordens.filter(o => inRange(o.dataEntrada)) : ordens;

      const faturamentoPeriodo = ordensFiltradas.reduce((s, o) => s + (Number(o.valorTotal) || 0), 0);
      const faturamentoDia = ordens.reduce((s, o) => s + (isSameDay(o.dataEntrada) ? (Number(o.valorTotal) || 0) : 0), 0);

      // faturamentoMes = current month
      const faturamentoMes = ordens.reduce((s, o) => {
        const d = o.dataEntrada ? new Date(o.dataEntrada) : null;
        if (!d) return s;
        return (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) ? s + (Number(o.valorTotal) || 0) : s;
      }, 0);

      const totalValorPecas = ordensFiltradas.reduce((s, o) => s + (Number(o.valorPecas) || 0), 0);
      const lucroBruto = faturamentoPeriodo - totalValorPecas;
      const margemLucroPct = faturamentoPeriodo ? Number(((lucroBruto / faturamentoPeriodo) * 100).toFixed(2)) : 0;

      const totalOrders = ordensFiltradas.length || 0;
      const ticketMedio = totalOrders ? Number((faturamentoPeriodo / totalOrders).toFixed(2)) : 0;

      const osAbertas = ordensFiltradas.filter(o => o.status && o.status.toLowerCase() === 'aberta').length;
      const osConcluidas = ordensFiltradas.filter(o => o.status && (o.status.toLowerCase() === 'concluido' || o.status.toLowerCase() === 'concluida' || o.status.toLowerCase() === 'entregue')).length;
      const osCanceladas = ordensFiltradas.filter(o => o.status && o.status.toLowerCase() === 'cancelada').length;
      const osGarantia = ordensFiltradas.filter(o => o.emGarantia === true).length;

      // tempo medio de reparo (hours)
      const concluids = ordensFiltradas.filter(o => o.dataEntrada && o.dataConclusao);
      const totalHours = concluids.reduce((s, o) => {
        const a = new Date(o.dataEntrada);
        const b = new Date(o.dataConclusao);
        return s + Math.max(0, (b - a) / (1000 * 60 * 60));
      }, 0);
      const tempoMedioHoras = concluids.length ? totalHours / concluids.length : 0;
      const tempoMedioReparo = tempoMedioHoras ? `${Math.floor(tempoMedioHoras)}h ${Math.round((tempoMedioHoras % 1) * 60)}m` : '-';

      // financeiro detalhado
      const receitaServicos = ordensFiltradas.reduce((s, o) => s + (Number(o.valorMaoDeObra) || 0), 0);
      const receitaPecas = ordensFiltradas.reduce((s, o) => s + (Number(o.valorPecas) || 0), 0);

      // custo total de peças estimado usando produtos list (produto.preco * quantidade usada)
      const produtoMap = new Map((produtos || []).map(p => [p.id, p]));
      let custoTotalPecas = 0;
      ordensFiltradas.forEach(o => {
        if (Array.isArray(o.pecasUtilizadas)) {
          o.pecasUtilizadas.forEach(pu => {
            const prod = produtoMap.get(pu.produtoID) || {};
            const preco = Number(prod.preco) || 0;
            const qtd = Number(pu.quantidade) || 0;
            custoTotalPecas += preco * qtd;
          });
        }
      });

      const inadimplencia = ordensFiltradas.filter(o => o.pago === false || o.pago === 'false').length;

      const faturamentoPorForma = ordensFiltradas.reduce((acc, o) => {
        const f = o.formaPagamento || 'Desconhecido';
        acc[f] = (acc[f] || 0) + (Number(o.valorTotal) || 0);
        return acc;
      }, {});

      // serviços mais realizados / lucrativos
      const servMap = new Map((servicos || []).map(s => [s.id, s]));
      const servCount = {};
      const servRevenue = {};
      ordensFiltradas.forEach(o => {
        if (Array.isArray(o.servicoIDs)) {
          o.servicoIDs.forEach(sid => {
            servCount[sid] = (servCount[sid] || 0) + 1;
            const svc = servMap.get(sid) || {};
            const preco = Number(svc.preco) || 0;
            servRevenue[sid] = (servRevenue[sid] || 0) + preco;
          });
        }
      });

      const topServicos = Object.keys(servCount).map(id => ({ id, nome: (servMap.get(id) || {}).nome || id, count: servCount[id], revenue: servRevenue[id] || 0 })).sort((a, b) => b.count - a.count).slice(0, 5);

      // peças mais usadas
      const pecasCount = {};
      ordensFiltradas.forEach(o => {
        if (Array.isArray(o.pecasUtilizadas)) {
          o.pecasUtilizadas.forEach(pu => {
            pecasCount[pu.produtoID] = (pecasCount[pu.produtoID] || 0) + (Number(pu.quantidade) || 0);
          });
        }
      });
      const topPecas = Object.keys(pecasCount).map(id => ({ id, nome: (produtoMap.get(id) || {}).nome || id, quantidade: pecasCount[id] })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10);

      // clientes
      const totalClientes = (clientes || []).filter(c => c.ativo).length;
      const novosClientes = (clientes || []).filter(c => {
        if (!c.dataCadastro) return false;
        if (!startDate && !endDate) return false;
        return inRange(c.dataCadastro);
      }).length;

      // tecnicos
      const techMap = new Map((funcionarios || []).map(f => [f.id, f]));
      const osPorTecnico = {};
      const faturamentoPorTecnico = {};
      ordensFiltradas.forEach(o => {
        const idt = o.funcionarioID;
        if (!idt) return;
        osPorTecnico[idt] = (osPorTecnico[idt] || 0) + 1;
        faturamentoPorTecnico[idt] = (faturamentoPorTecnico[idt] || 0) + (Number(o.valorTotal) || 0);
      });

      // comparativo mensal (mês atual vs mês anterior)
      const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const faturThisMonth = ordens.reduce((s, o) => {
        const d = o.dataEntrada ? new Date(o.dataEntrada) : null;
        if (!d) return s;
        return (d >= firstDayThisMonth) ? s + (Number(o.valorTotal) || 0) : s;
      }, 0);
      const faturPrevMonth = ordens.reduce((s, o) => {
        const d = o.dataEntrada ? new Date(o.dataEntrada) : null;
        if (!d) return s;
        return (d >= firstDayPrevMonth && d < firstDayThisMonth) ? s + (Number(o.valorTotal) || 0) : s;
      }, 0);

      setData({
        faturamentoDia,
        faturamentoMes,
        faturamentoPeriodo,
        lucroBruto,
        margemLucroPct,
        ticketMedio,
        osAbertas,
        osConcluidas,
        osCanceladas,
        osGarantia,
        tempoMedioReparo,
        receitaServicos,
        receitaPecas,
        custoTotalPecas,
        inadimplencia,
        faturamentoPorForma,
        topServicos,
        topPecas,
        totalClientes,
        novosClientes,
        osPorTecnico,
        faturamentoPorTecnico,
        faturThisMonth,
        faturPrevMonth
      });
    } catch (err) {
      console.error('Erro ao buscar resumo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRange = () => {
    fetchResumo(rangeStart, rangeEnd);
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatorio');
      
      if (Object.keys(data).length === 0) {
        worksheet.addRow(['Nenhum dado para exportar']);
      } else {
        const headers = Object.keys(data);
        worksheet.addRow(headers);
        worksheet.addRow(Object.values(data));
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `relatorio_${Date.now()}.xlsx`);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório para Excel');
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportChart = (chartType) => {
    alert(`Exportar gráfico de ${chartType} como PNG\n(Função em desenvolvimento)`);
  };

  return (
    <Container>
      <Title>Relatórios de Vendas</Title>

      <Controls>
        <div>
            <label>Filtrar por Mês</label>
            <select value={selectedMonth} onChange={handleMonthChange}>
              <option value="">Todos os Períodos</option>
              {last12Months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
        </div>
        <div>
          <label>Início</label>
          <DateInput type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
        </div>
        <div>
          <label>Fim</label>
          <DateInput type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleApplyRange} disabled={loading}>Aplicar</button>
          <ExportButtons>
            <button onClick={handleExportExcel}>Exportar Excel</button>
            <button onClick={handleExportJSON}>Exportar JSON</button>
          </ExportButtons>
        </div>
      </Controls>

      <KPIsGrid>
        <KpiCard>
          <strong>Faturamento do dia</strong>
          <div>R$ {data.faturamentoDia ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>Faturamento do mês</strong>
          <div>R$ {data.faturamentoMes ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>Faturamento por período</strong>
          <div>R$ {data.faturamentoPeriodo ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>Lucro bruto</strong>
          <div>R$ {data.lucroBruto ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>Margem de lucro (%)</strong>
          <div>{data.margemLucroPct ?? '-'}%</div>
        </KpiCard>
        <KpiCard>
          <strong>Ticket médio</strong>
          <div>R$ {data.ticketMedio ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>OS abertas</strong>
          <div>{data.osAbertas ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>OS concluídas</strong>
          <div>{data.osConcluidas ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>OS canceladas</strong>
          <div>{data.osCanceladas ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>OS em garantia</strong>
          <div>{data.osGarantia ?? '-'}</div>
        </KpiCard>
        <KpiCard>
          <strong>Tempo médio de reparo</strong>
          <div>{data.tempoMedioReparo ?? '-'}</div>
        </KpiCard>
      </KPIsGrid>

      {/* Gráficos principais */}
      <Section>
        <SectionHeader>
          Comparativo Mensal
          <ChartExportBtn onClick={() => handleExportChart('comparativo')} title="Exportar gráfico">📊</ChartExportBtn>
        </SectionHeader>
        <SectionBody style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[{ name: 'Mês Anterior', value: data.faturPrevMonth ?? 0 }, { name: 'Mês Atual', value: data.faturThisMonth ?? 0 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>
          Serviços mais realizados
          <ChartExportBtn onClick={() => handleExportChart('servicos')} title="Exportar gráfico">📊</ChartExportBtn>
        </SectionHeader>
        <SectionBody style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(data.topServicos || []).map(s => ({ name: s.nome, count: s.count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }} formatter={(value) => `${value} OS`} />
              <Bar dataKey="count" fill={COLORS[1]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>
          Faturamento por forma de pagamento
          <ChartExportBtn onClick={() => handleExportChart('pagamento')} title="Exportar gráfico">📊</ChartExportBtn>
        </SectionHeader>
        <SectionBody style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={Object.keys(data.faturamentoPorForma || {}).map(k => ({ name: k, value: data.faturamentoPorForma[k] }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {(Object.keys(data.faturamentoPorForma || {})).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Financeiro</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Receita total</td>
                  <td>R$ {Number(data.faturamentoPeriodo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Receita de serviços</td>
                  <td>R$ {Number(data.receitaServicos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Receita de venda de peças/produtos</td>
                  <td>R$ {Number(data.receitaPecas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Custo total de peças</td>
                  <td>R$ {Number(data.custoTotalPecas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#e7f3ff' }}>
                  <td>Lucro líquido estimado</td>
                  <td>R$ {Number((data.faturamentoPeriodo || 0) - (data.custoTotalPecas || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Inadimplência (OSs não pagas)</td>
                  <td>{data.inadimplencia || 0}</td>
                </tr>
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Serviços</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Quantidade</th>
                  <th>Receita Total</th>
                </tr>
              </thead>
              <tbody>
                {(data.topServicos || []).map((s, i) => (
                  <tr key={i}>
                    <td>{s.nome}</td>
                    <td>{s.count}</td>
                    <td>R$ {Number(s.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {(!data.topServicos || data.topServicos.length === 0) && (
                  <tr><td colSpan="3">Nenhum serviço registrado</td></tr>
                )}
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Estoque / Peças</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Peça</th>
                  <th>Quantidade Usada</th>
                </tr>
              </thead>
              <tbody>
                {(data.topPecas || []).map((p, i) => (
                  <tr key={i}>
                    <td>{p.nome}</td>
                    <td>{p.quantidade}</td>
                  </tr>
                ))}
                {(!data.topPecas || data.topPecas.length === 0) && (
                  <tr><td colSpan="2">Nenhuma peça registrada</td></tr>
                )}
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Clientes</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total de clientes ativos</td>
                  <td>{data.totalClientes || 0}</td>
                </tr>
                <tr>
                  <td>Novos clientes no período</td>
                  <td>{data.novosClientes || 0}</td>
                </tr>
                <tr>
                  <td>Ticket médio por cliente</td>
                  <td>R$ {Number(data.ticketMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Operacional</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>OS em atraso</td>
                  <td>{data.osAbertas || 0}</td>
                </tr>
                <tr>
                  <td>OS concluídas no período</td>
                  <td>{data.osConcluidas || 0}</td>
                </tr>
                <tr>
                  <td>Taxa de conclusão no prazo (%)</td>
                  <td>{data.osConcluidas && (data.osAbertas + data.osConcluidas) ? Number(((data.osConcluidas / (data.osAbertas + data.osConcluidas)) * 100).toFixed(1)) : '-'}%</td>
                </tr>
                <tr>
                  <td>Tempo médio de reparo</td>
                  <td>{data.tempoMedioReparo || '-'}</td>
                </tr>
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Técnicos / Funcionários</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>OS Realizadas</th>
                  <th>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(data.osPorTecnico || {}).length > 0 ? (
                  Object.keys(data.osPorTecnico || {}).map((tid) => (
                    <tr key={tid}>
                      <td>{tid}</td>
                      <td>{data.osPorTecnico[tid]}</td>
                      <td>R$ {Number(data.faturamentoPorTecnico[tid] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3">Nenhum técnico registrado</td></tr>
                )}
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Comparativos e Tendências</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Faturamento</th>
                  <th>Crescimento</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mês Anterior</td>
                  <td>R$ {Number(data.faturPrevMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>-</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#e7f3ff' }}>
                  <td>Mês Atual</td>
                  <td>R$ {Number(data.faturThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{data.faturPrevMonth ? Number((((data.faturThisMonth - data.faturPrevMonth) / data.faturPrevMonth) * 100).toFixed(1)) : '-'}%</td>
                </tr>
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader>Alertas Inteligentes</SectionHeader>
        <SectionBody>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Alerta</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: data.margemLucroPct < 25 ? '#ffe7e7' : 'transparent' }}>
                  <td>Margem abaixo de 25%</td>
                  <td>{data.margemLucroPct < 25 ? '⚠️ Alerta' : '✓ OK'}</td>
                </tr>
                <tr style={{ backgroundColor: data.osCanceladas > 3 ? '#ffe7e7' : 'transparent' }}>
                  <td>Alta taxa de cancelamento</td>
                  <td>{data.osCanceladas > 3 ? '⚠️ Alerta' : '✓ OK'}</td>
                </tr>
                <tr style={{ backgroundColor: data.inadimplencia > 5 ? '#ffe7e7' : 'transparent' }}>
                  <td>Inadimplência elevada</td>
                  <td>{data.inadimplencia > 5 ? '⚠️ Alerta (' + data.inadimplencia + ')' : '✓ OK'}</td>
                </tr>
                <tr style={{ backgroundColor: data.osAbertas > 10 ? '#ffe7e7' : 'transparent' }}>
                  <td>Muitas OS em atraso</td>
                  <td>{data.osAbertas > 10 ? '⚠️ Alerta (' + data.osAbertas + ')' : '✓ OK'}</td>
                </tr>
              </tbody>
            </StyledTable>
          </TableWrapper>
        </SectionBody>
      </Section>
    </Container>
  );
};

export default RelatoriosResultados;
