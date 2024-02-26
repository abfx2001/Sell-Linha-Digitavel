import "core-js/stable";
import "regenerator-runtime/runtime";
import "./assets/css/style.css";
import Toastify from 'toastify-js';

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

const botaoSubmit = document.querySelector("button[type='submit']");
const inputCpfCnpj = document.querySelector("input")

inputCpfCnpj.addEventListener("focus", function() {
  botaoSubmit.disabled = false;
  inputCpfCnpj.classList.remove("erro");
});

botaoSubmit.addEventListener("click", function () {
  botaoSubmit.disabled = true;
  
  if (validaCPFouCNPJ(inputCpfCnpj.value)){
    botaoSubmit.disabled = false;
  } else {
    inputCpfCnpj.classList.add("erro");
    Toastify({
      text: "CPF/CNPJ inválido!",
      duration: 3000,
      close: true,
      gravity: "top", 
      position: "right", 
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, rgba(235,72,72,1), rgba(255,166,0,1))",
      }, 
    }).showToast();
  }
  function validaCPFouCNPJ(valor) {
    valor = valor.replace(/[/.-]/g, "");
    if (valor.length === 11) {
      return validaCPF(valor);
    }
    if (valor.length === 14) {
      return validaCNPJ(valor);
    }
    return false;
  }
  function validaCPF(cpf) {
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.charAt(i - 1)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
      resto = 0;
    }
    if (resto !== parseInt(cpf.charAt(9))) {
      return false;
    }
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.charAt(i - 1)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
      resto = 0;
    }
    if (resto !== parseInt(cpf.charAt(10))) {
      return false;
    }
    return true;
  }
  function validaCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14) {
      return false;
    }
    var tamanho = cnpj.length - 2;
    var numeros = cnpj.substring(0, tamanho);
    var digitos = cnpj.substring(tamanho);
    var soma = 0;
    var pos = tamanho - 7;
    for (var i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) {
      return false;
    }
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) {
      return false;
    }
    return true;
  }
});
