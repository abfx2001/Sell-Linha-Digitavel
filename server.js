const express = require("express");
const app = express();
const path = require("path");
const soap = require("soap");
require("dotenv").config();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");

app.post("/buscar", async (req, res) => {
  const { fildValue } = req.body;
  const fildValueClear = fildValue.replace(/[^\d]/g, '');
  res.redirect(`/resultados?fildValue=${fildValueClear}`);
});

app.get("/resultados", (req, res) => {
  const cpfCnpj = req.query.fildValue;
  buscaCPFJson(cpfCnpj)
    .then((jsonBuscaCPF) => {
      res.render(__dirname + "/public/resultados.ejs", {
        cpfCnpj: cpfCnpj,
        Condominio: jsonBuscaCPF.Condominio,
      });
    })
    .catch((error) => {
      console.log("error", error);
      res.status(500).send({ error: "Ocorreu um erro ao buscar o CPF." });
      res.redirect(`/erros`)
      throw new Error('SOAP_REQUEST_ERROR', { cause: error });
    });
});

app.post("/show-linha", async (req, res) => {
  try {
    const dados = req.body;
    const jsonResultadoLinhaDigitavel = await buscaRelacaoRecibo(dados);
    res.redirect(`/show-linha?linhaValue=${jsonResultadoLinhaDigitavel}`);
  } catch (err) {
    console.error("Erro ao renderizar:");
    res.redirect(`/erros?mensagem=${"Erro ao gerar linha digitável"}`);
  }
});

app.get("/show-linha", async (req, res) => {
  try {
    const LinhaDigitavelJson = req.query.linhaValue;
    const LinhaDigitavelJsonValue = JSON.parse(LinhaDigitavelJson)

    function converterData(dataISO) {
      const dataObj = new Date(dataISO);
      const dia = String(dataObj.getDate()).padStart(2, '0');
      const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
      const ano = dataObj.getFullYear();
      return `${dia}-${mes}-${ano}`;
    }

    function formatarValor(valor) {
      const valorFormatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      return valorFormatado;
    }

    LinhaDigitavelJsonValue.forEach((recibo) => {
      recibo.vencimento = converterData(recibo.vencimento);
      recibo.valor = formatarValor(recibo.valor);
    });

    res.render(__dirname + "/public/linhaDigitavel.ejs", {
      linhaDigitavelStg: LinhaDigitavelJsonValue,
    });
  } catch (error) {
    console.error("Erro ao renderizar:", error);
    res.status(500).send("Erro ao renderizar a página");
  }
});

// render da página dos erros <--
app.get("/erros", (req, res) => {
  res.render(__dirname + "/public/erros.ejs");
})

// caminho dos erros <--
app.use((err, req, res, next) => {
  if (err.message === 'SOAP_REQUEST_ERROR') {
    return res.redirect(`/erros`); 
  }
  if (err.message === 'NO_CPF_OR_CNPJ_ASSIGNMENT') {
    return res.redirect(`/erros`); 
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

const url =
  "http://selladm.dyndns.org:5500/Condominioweb/wsDocumentos.asmx?WSDL";

async function buscaCPFJson(cpf) {
  const request = {
    cnpj_cpf: cpf,
    usuario: process.env.USER,
    senha: process.env.SENHA,
    chave: process.env.CHAVE,
  };
  try {
    const client = await soap.createClientAsync(url, {
      endpoint: url,
    });
    const result = await client.BuscaCPF_Chatbot_JsonAsync(request);
    return(JSON.parse(result[0].BuscaCPF_Chatbot_JsonResult));
  } catch (err) {
    console.error("Error making SOAP request:", err);
    throw new Error('SOAP_REQUEST_ERROR', { cause: err });
  }
}

async function buscaRelacaoRecibo(jsonBuscaCPF) {
  const request = {
    condominio: jsonBuscaCPF.numero,
    bloco: jsonBuscaCPF.bloco,
    unidade: jsonBuscaCPF.unidade,
    tipo: jsonBuscaCPF.tipo,
    usuario: process.env.USER,
    senha: process.env.SENHA,
    chave: process.env.CHAVE,
  };
  try {
    const client = await soap.createClientAsync(url, {
      endpoint: url,
    });
    const result = await client.RelacaoRecibos_Chatbot_JsonAsync(request);
    const jsonResultadoLinhaDigitavel = await buscaSegundaViaBoleto(result[0].RelacaoRecibos_Chatbot_JsonResult);
    return jsonResultadoLinhaDigitavel;
  } catch (err) {
    console.error("Error making SOAP request:", err);
  }
}

async function buscaSegundaViaBoleto(relacaoRecibosStg) {
  const relacaoRecibos = JSON.parse(relacaoRecibosStg);
  const resultArray = [];
  for (const reciboObj of relacaoRecibos.Recibos) {
    const reciboNumber = reciboObj.recibo;
    const requestResult = await buscaLinhaDigitavel(reciboNumber);
    reciboObj.linhaDigitavel = requestResult;
    resultArray.push(reciboObj);
  }
  const resultArrayStg = JSON.stringify(resultArray)
  return resultArrayStg;
}

async function buscaLinhaDigitavel(reciboNumber) {
  const request = {
    recibo: reciboNumber,
    usuario: process.env.USER,
    senha: process.env.SENHA,
    chave: process.env.CHAVE,
  };
  try {
    const client = await soap.createClientAsync(url, {
      endpoint: url,
    });
    const result = await client.SegundaViaBoletos_Chatbot_JsonAsync(request);
    const resultJson = JSON.parse(result?.[0]?.SegundaViaBoletos_Chatbot_JsonResult || '[]');
    return (resultJson.LinhaDigitavel[0].linha_digitavel);
  } catch (err) {
    console.error("Error making SOAP request:", err);
  }
}

app.listen(3003, function () {
  console.log("Servidor aberto na porta 3003");
  console.log("http://localhost:3003");
});
