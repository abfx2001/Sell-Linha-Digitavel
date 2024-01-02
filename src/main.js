import "core-js/stable";
import "regenerator-runtime/runtime";

import "./assets/css/style.css";

function criarTabela(jsonResponse) {
  // Verifique se o objeto Condominio existe e se é um array
  if (
    jsonResponse.hasOwnProperty("Condominio") &&
    Array.isArray(jsonResponse.Condominio)
  ) {
    // Crie o elemento de tabela e o cabeçalho
    var tabelaHtml = `<table class="table table-hover table-bordered container-fluid"><tr><th>Condominio</th><th>Nome</th><th>Bloco</th><th>Unidade</th><th>Tipo</th><th>Gerente</th><th>Nome Gerente</th></tr>`;

    // Itere sobre os objetos condominio
    jsonResponse.Condominio.forEach(function (condominioObject) {
      // Acesse as propriedades do objeto condominio usando a notação de colchetes
      tabelaHtml +=
        "<tr><td>" +
        condominioObject["condominio"] +
        "</td><td>" +
        condominioObject["nome"] +
        "</td><td>" +
        condominioObject["bloco"] +
        "</td><td>" +
        condominioObject["unidade"] +
        "</td><td>" +
        condominioObject["tipo"] +
        "</td><td>" +
        condominioObject["gerente"] +
        "</td><td>" +
        condominioObject["nome_gerente"] +
        "</td></tr>";
    });
    tabelaHtml += "</table>";
    document.getElementById("tabela").innerHTML = tabelaHtml;
  } else {
    console.log(
      "O JSON retornado pela função buscaCPFJson está incompleto ou em um formato inesperado."
    );
  }
}
