import axios from 'axios';

const apiCliente = axios.create({
  baseURL: 'https://mantec2.portalmantec.com.br/api',
});

export default apiCliente;