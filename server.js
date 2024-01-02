const express = require("express");
const app = express();
const path = require("path");
const parseString = require("xml2js").parseString;
require("dotenv").config();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/buscar", async (req, res) => {
  const { fildValue } = req.body;
  res.redirect(`/resultados?fildValue=${fildValue}`);
  // buscaCPFJson(fildValue)
  //   .then((jsonBuscaCPF) => {
  //     res.redirect("/resultados");
  //     //criarTabela(jsonBuscaCPF);
  //     //res.send(jsonBuscaCPF);
  //   })
  //   .catch((error) => {
  //     console.log("error", error);
  //     res.status(500).send({ error: "Ocorreu um erro ao buscar o CPF." });
  //   });
});

app.get("/resultados", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/resultados.html"));
  const cpfCnpj = req.query.fildValue;
  buscaCPFJson(cpfCnpj)
    .then((jsonBuscaCPF) => {
      console.log(jsonBuscaCPF);
    })
    .catch((error) => {
      console.log("error", error);
      res.status(500).send({ error: "Ocorreu um erro ao buscar o CPF." });
    });
});

function buscaCPFJson(cpf) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/soap+xml; charset=utf-8");
  myHeaders.append("Cookie", process.env.COOKIE);

  var raw = `<?xml version="1.0" encoding="utf-8"?>
       <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
         <soap12:Body>
           <BuscaCPF_Chatbot_Json xmlns="http://gosati.com.br/webservices/">
             <cnpj_cpf>${cpf}</cnpj_cpf>
             <usuario>${process.env.USER}</usuario>
             <senha>${process.env.SENHA}</senha>
             <chave>${process.env.CHAVE}</chave>
           </BuscaCPF_Chatbot_Json>
         </soap12:Body>
       </soap12:Envelope>`;

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  return fetch(process.env.URL_CON, requestOptions)
    .then((response) => response.text())
    .then((result) => {
      return new Promise((resolve, reject) => {
        parseString(result, function (err, resultDataJson) {
          if (err) {
            console.error("Erro ao analisar XML:", err);
            reject(err);
            return;
          }
          const buscaCPFJsonResult =
            resultDataJson["soap:Envelope"]["soap:Body"][0][
              "BuscaCPF_Chatbot_JsonResponse"
            ][0]["BuscaCPF_Chatbot_JsonResult"][0];
          const jsonBuscaCPF = JSON.parse(buscaCPFJsonResult);
          resolve(jsonBuscaCPF);
        });
      });
    })
    .catch((error) => {
      console.log("error", error);
      throw error;
    });
}

function buscaRelacaoRecibo(jsonBuscaCPF) {
  let jsonResultRelacaoRecibos = "";
  for (i = 0; i < Object.keys(jsonBuscaCPF.Condominio).length; i++) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/soap+xml; charset=utf-8");
    myHeaders.append("Cookie", process.env.COOKIE);

    var raw = `<?xml version="1.0" encoding="utf-8"?>
      <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
          <RelacaoRecibos_Chatbot_Json xmlns="http://gosati.com.br/webservices/">
            <condominio>${jsonBuscaCPF.Condominio[i].condominio}</condominio>
            <bloco>${jsonBuscaCPF.Condominio[i].bloco}</bloco>
            <unidade>${jsonBuscaCPF.Condominio[i].unidade}</unidade>
            <tipo>${jsonBuscaCPF.Condominio[i].tipo}</tipo>
            <usuario>${process.env.USER}</usuario>
            <senha>${process.env.SENHA}</senha>
            <chave>${process.env.CHAVE}</chave>
          </RelacaoRecibos_Chatbot_Json>
        </soap12:Body>
      </soap12:Envelope>`;

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(process.env.URL_CON, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        parseString(result, function (err, resultDataJson) {
          if (err) {
            console.error("Erro ao analisar XML:", err);
            return;
          }
          const relacaoRecibosJsonResult =
            resultDataJson["soap:Envelope"]["soap:Body"][0][
              "RelacaoRecibos_Chatbot_JsonResponse"
            ][0]["RelacaoRecibos_Chatbot_JsonResult"][0];
          const relacaoRecibos = JSON.parse(relacaoRecibosJsonResult);
          console.log(relacaoRecibos);
          buscaSegundaViaBoleto(relacaoRecibos);
          console.log("proximo:");
        });
      })
      .catch((error) => console.log("error", error));
  }
}

function buscaSegundaViaBoleto(relacaoRecibos) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/soap+xml; charset=utf-8");
  myHeaders.append("Cookie", process.env.COOKIE);

  var raw = `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <SegundaViaBoletos_Chatbot_Json xmlns="http://gosati.com.br/webservices/">
          <recibo>${relacaoRecibos.Recibos[0].recibo}</recibo>
          <usuario>${process.env.USER}</usuario>
          <senha>${process.env.SENHA}</senha>
          <chave>${process.env.CHAVE}</chave>
        </SegundaViaBoletos_Chatbot_Json>
      </soap12:Body>
    </soap12:Envelope>`;

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch(process.env.URL_CON, requestOptions)
    .then((response) => response.text())
    .then((result) => {
      parseString(result, function (err, resultDataJson) {
        if (err) {
          console.error("Erro ao analisar XML:", err);
          return;
        }
        const segundaViaBoletoResult =
          resultDataJson["soap:Envelope"]["soap:Body"][0][
            "SegundaViaBoletos_Chatbot_JsonResponse"
          ][0]["SegundaViaBoletos_Chatbot_JsonResult"][0];
        const segundaViaBoleto = JSON.parse(segundaViaBoletoResult);
        console.log(segundaViaBoleto.LinhaDigitavel[0].linha_digitavel); // Saída do conteúdo dentro de RelacaoRecibos_Chatbot_Json
      });
    })
    .catch((error) => console.log("error", error));
}

//buscaCPFJson("16313904818");
//06415150812 -> uma unidade
//16313904818 -> duas unidades

app.listen(3003, function () {
  console.log("Servidor aberto na porta 3003");
  console.log("http://localhost:3003");
});
