import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 }, // 10 usuários virtuais durante 1 minuto
    { duration: '1m', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '1m', target: 10 },
  ],
  ext: {
    influxDB: {
      flushInterval: '30s', // Ajuste o intervalo de envio conforme necessário
    },
  },
};

const baseURL = 'http://api.sgf.qa.inovvati.com.br/graphql/';

const queries = [
  
  { 
    operationName:"selecaoById",
    "variables":{
        "id":"U2VsZWNhbwppMg=="
    },
      query:`query selecaoById($id: ID!) {
                 selecaoById(id: $id) {
             id
             intId
             codigo
             diretrizId
             trimestreId
             descricao
             diretriz {
                 tipoDiretriz {
                        nome
                        __typename
                 }
                  intId
                  codigo
                  tipoDiretrizId
                  __typename
             }
             aplicarDiretriz
             qbValue
             qbLogic
             qbConfig
             filtro
             trimestre {
                 codigoTrimestre
                 __typename
             }
             selecaoStatusId
             selecaoStatus {
                  id
                  intId
                  nome
                  __typename
             }
             __typename
          }
         }`
  },
  {
    operationName:"malhasPivotadasEmpresasSelecionadasManuais",
    variables:{
      "selecaoId":2,
      "orderBy":"",
      "filter":""
    },
    query:`query malhasPivotadasEmpresasSelecionadasManuais($selecaoId: Int!, $orderBy: String, $filter: String) {
              malhasPivotadasEmpresasSelecionadasManuais(
                  selecaoId: $selecaoId
                  orderBy: $orderBy
                  filter: $filter
              ) {
              selecionadasCPlanf
              manuais
              naoSelecionadasCPlanf
              totalCount
              __typename
             }
    }`
  },
  {
    operationName:"selecaoContribuinteEmUsoBySelecao",
    variables:{
      "selecaoId":2
    },
    query:`query selecaoContribuinteEmUsoBySelecao($selecaoId: Int!) {
      selecaoContribuinteEmUsoBySelecao(selecaoId: $selecaoId) {
          selecaoId
          usuario
          hashCnpjCpfIe
          ie
          cnpjCpf
          __typename
      }
    }`
  },
];

export default function () {
  let queryResponses = {};

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i].query;
    const variables = queries[i].variables || {};
    const response = http.post(baseURL, JSON.stringify({ query, variables }), {
      headers: { 'Content-Type': 'application/json' },
    });

    queryResponses[queries[i].operationName] = response;
    sleep(1); // Aguarda 1 segundo entre as requisições para não sobrecarregar o servidor
  }

  for (let queryoperationName in queryResponses) {
    const response = queryResponses[queryoperationName];
    check(response, {
      'Status is 200': (r) => r.status === 200,
      [`Contains ${queryoperationName} data`]: (r) => r.body.includes(queryoperationName),
    });
  }
}