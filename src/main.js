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

document.querySelectorAll('.copy-link-btn').forEach(button => {
  button.addEventListener('click', () => {
      Toastify({
        text: "Copiado!",
        duration: 3000,
        close: true,
        gravity: "top", 
        position: "right", 
        stopOnFocus: true,
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        onClick: function(){} 
      }).showToast();
  });
});

const input = document.querySelector("#cpfCnpj");

input.addEventListener("input", function () {
  mascaraMutuario(this, cpfCnpj);
});

input.addEventListener("blur", function () {
  clearTimeout();
});

function mascaraMutuario(o, f) {
  let v_obj = o;
  let v_fun = f;
  setTimeout(function () {
    v_obj.value = v_fun(v_obj.value);
  }, 1);
}

function cpfCnpj(v) {
  v = v.replace(/\D/g, "");
  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v;
}

String.prototype.reverse = function () {
  return this.split("").reverse().join("");
};