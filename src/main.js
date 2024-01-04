import "core-js/stable";
import "regenerator-runtime/runtime";
import "./assets/css/style.css";

document.addEventListener("DOMContentLoaded", function () {
  var visualizarLinks = document.getElementsByClassName("visualizar-link");

  for (var i = 0; i < visualizarLinks.length; i++) {
    visualizarLinks[i].addEventListener("click", function (event) {
      event.preventDefault();

      var row = this.parentNode.parentNode;
      var numero = row.cells[0].textContent;
      var condominio = row.cells[1].textContent;
      var bloco = row.cells[2].textContent;
      var unidade = row.cells[3].textContent;
      var tipo = row.cells[4].textContent;

      var request = new Request("/show-linha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero: numero,
          condominio: condominio,
          bloco: bloco,
          unidade: unidade,
          tipo: tipo,
        }),
      });

      fetch(request)
        .then(function (response) {
          window.location.href = response.url;
        })
        .catch(function (error) {
          console.error("Erro ao fazer a requisição:", error);
        });
    });
  }
});
