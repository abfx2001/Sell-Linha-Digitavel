const express = require("express");
const app = express();
const path = require("path");
const parseString = require("xml2js").parseString;
const crypto = require("crypto");
require("dotenv").config();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");

const cipher = crypto.createCipher("aes-256-cbc", process.env.SECRECY);

app.post("/buscar", async (req, res) => {
  const { fildValue } = req.body;
  res.redirect(`/resultados?fildValue=${fildValue}`);
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
    });
});

app.post("/show-linha", async (req, res) => {
  try {
    const dados = req.body;
    // aqui onde deve ser mudado
    const jsonResultadoLinhaDigitavel = await buscaRelacaoRecibo(dados);
    const StgResultadoLinhaDigitavel = JSON.stringify(jsonResultadoLinhaDigitavel)
    console.log(StgResultadoLinhaDigitavel)
    // let encryptedData = cipher.update(StgResultadoLinhaDigitavel, "utf8", "hex");
    // encryptedData += cipher.final("hex");
    // console.log(encryptedData);
    res.redirect(`/show-linha?linhaValue=${StgResultadoLinhaDigitavel}`);
  } catch (error) {
    console.error("Erro ao renderizar:", error);
    res.status(500).send("Erro ao renderizar a página");
  }
});

app.get("/show-linha", async (req, res) => {
  try {
    const LinhaDigitavelJson = req.query.linhaValue;
    // const decipher = crypto.createDecipher("aes-256-cbc", process.env.SECRECY);
    // let decryptedData = decipher.update(LinhaDigitavelJson, "hex", "utf8");
    // decryptedData += decipher.final("utf8");
    res.render(__dirname + "/public/linhaDigitavel.ejs", {
      linhaDigitavelStg: LinhaDigitavelJson,
    });
  } catch (error) {
    console.error("Erro ao renderizar:", error);
    res.status(500).send("Erro ao renderizar a página");
  }
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
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/soap+xml; charset=utf-8");
  myHeaders.append("Cookie", process.env.COOKIE);

  var raw = `<?xml version="1.0" encoding="utf-8"?>
      <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
          <RelacaoRecibos_Chatbot_Json xmlns="http://gosati.com.br/webservices/">
            <condominio>${jsonBuscaCPF.numero}</condominio>
            <bloco>${jsonBuscaCPF.bloco}</bloco>
            <unidade>${jsonBuscaCPF.unidade}</unidade>
            <tipo>${jsonBuscaCPF.tipo}</tipo>
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
          const relacaoRecibosJsonResult =
            resultDataJson["soap:Envelope"]["soap:Body"][0][
              "RelacaoRecibos_Chatbot_JsonResponse"
            ][0]["RelacaoRecibos_Chatbot_JsonResult"][0];
          const relacaoRecibos = JSON.parse(relacaoRecibosJsonResult);
          console.log(relacaoRecibosJsonResult);
          console.log(relacaoRecibos);
          console.log("---------------------------");
          resolve(buscaSegundaViaBoleto(relacaoRecibos));
        });
      });
    })
    .catch((error) => console.log("error", error));
}

function buscaSegundaViaBoleto(relacaoRecibos) {
  const promises = relacaoRecibos.Recibos.map(recibo => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/soap+xml; charset=utf-8");
    myHeaders.append("Cookie", process.env.COOKIE);

    var raw = `<?xml version="1.0" encoding="utf-8"?>
      <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
          <SegundaViaBoletos_Chatbot_Json xmlns="http://gosati.com.br/webservices/">
            <recibo>${recibo.recibo}</recibo>
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

    return fetch(process.env.URL_CON, requestOptions)
      .then(response => response.text())
      .then(result => {
        return new Promise((resolve, reject) => {
          parseString(result, function (err, resultDataJson) {
            if (err) {
              console.error("Erro ao analisar XML:", err);
              reject(err);
              return;
            }
            const segundaViaBoletoResult =
              resultDataJson["soap:Envelope"]["soap:Body"][0][
                "SegundaViaBoletos_Chatbot_JsonResponse"
                ][0]["SegundaViaBoletos_Chatbot_JsonResult"][0];
            const segundaViaBoleto = JSON.parse(segundaViaBoletoResult);
            const LinhaDigitavelStg =
              segundaViaBoleto.LinhaDigitavel[0].linha_digitavel;
            resolve({ ...recibo, linhadigitavel: LinhaDigitavelStg });
          });
        });
      })
      .catch(error => console.log("error", error));
  });

  return Promise.all(promises)
    .then(results => {
      console.log({ Recibos: results })
      return { Recibos: results };
    })
    .catch(error => console.log("error", error));
}


// function buscaSegundaViaBoleto(relacaoRecibos) {
//   var myHeaders = new Headers();
//   myHeaders.append("Content-Type", "application/soap+xml; charset=utf-8");
//   myHeaders.append("Cookie", process.env.COOKIE);
//
//   var raw = `<?xml version="1.0" encoding="utf-8"?>
//     <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
//       <soap12:Body>
//         <SegundaViaBoletos_Chatbot_Json xmlns="http://gosati.com.br/webservices/">
//           <recibo>${relacaoRecibos.Recibos[0].recibo}</recibo>
//           <usuario>${process.env.USER}</usuario>
//           <senha>${process.env.SENHA}</senha>
//           <chave>${process.env.CHAVE}</chave>
//         </SegundaViaBoletos_Chatbot_Json>
//       </soap12:Body>
//     </soap12:Envelope>`;
//
//   var requestOptions = {
//     method: "POST",
//     headers: myHeaders,
//     body: raw,
//     redirect: "follow",
//   };
//
//   return fetch(process.env.URL_CON, requestOptions)
//     .then((response) => response.text())
//     .then((result) => {
//       return new Promise((resolve, reject) => {
//         parseString(result, function (err, resultDataJson) {
//           if (err) {
//             console.error("Erro ao analisar XML:", err);
//             reject(err);
//             return;
//           }
//           const segundaViaBoletoResult =
//             resultDataJson["soap:Envelope"]["soap:Body"][0][
//               "SegundaViaBoletos_Chatbot_JsonResponse"
//             ][0]["SegundaViaBoletos_Chatbot_JsonResult"][0];
//           const segundaViaBoleto = JSON.parse(segundaViaBoletoResult);
//           console.log(segundaViaBoleto);
//           console.log("----------------------------");
//           const LinhaDigitavelStg =
//             segundaViaBoleto.LinhaDigitavel[0].linha_digitavel;
//           resolve(LinhaDigitavelStg);
//         });
//       });
//     })
//     .catch((error) => console.log("error", error));
// }

app.listen(3003, function () {
  console.log("Servidor aberto na porta 3003");
  console.log("http://localhost:3003");
});
