var express = require("express");
const axios = require("axios");
var fs = require("fs");
var kdbush = require("kdbush");
var geokdbush = require("geokdbush");

var spatial;

var app = express();

app.set("port", process.env.PORT || 80);
app.set("json spaces", 1);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/getGasolineras/:lat/:long/:q/:t", (req, res) => {
  res.json(
    geokdbush.around(
      spatial,
      parseFloat(req.params.lat),
      parseFloat(req.params.long),
      Math.min(500, parseInt(req.params.q)),
      undefined,
      function (item) {
        return item.data[parseInt(req.params.t) + 5] != "";
      }
    )
  );
});

app.listen(app.get("port"), () => {
  console.log(`Server listening on port ${app.get("port")}`);
  updateData();
});

function updateData() {
  console.log("Loading data");
  const url =
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres";
  const file = "data.json";
  axios
    .get(url)
    .then((res) => {
      let json = res["data"];
      let gasolineras = json["ListaEESSPrecio"];
      var data = [];
      gasolineras.forEach((gasolinera) => {
        var gas = {
          lat: parseFloat(gasolinera["Latitud"].replace(",", ".")),
          long: parseFloat(gasolinera["Longitud (WGS84)"].replace(",", ".")),
          data: [
            gasolinera["Rótulo"],
            gasolinera["Provincia"],
            gasolinera["Municipio"],
            gasolinera["C.P."],
            gasolinera["Dirección"],
            gasolinera["Precio Biodiesel"].replace(",", "."),
            gasolinera["Precio Bioetanol"].replace(",", "."),
            gasolinera["Precio Gas Natural Comprimido"].replace(",", "."),
            gasolinera["Precio Gas Natural Licuado"].replace(",", "."),
            gasolinera["Precio Gases licuados del petróleo"].replace(",", "."),
            gasolinera["Precio Gasoleo A"].replace(",", "."),
            gasolinera["Precio Gasoleo B"].replace(",", "."),
            gasolinera["Precio Gasoleo Premium"].replace(",", "."),
            gasolinera["Precio Gasolina 95 E10"].replace(",", "."),
            gasolinera["Precio Gasolina 95 E5"].replace(",", "."),
            gasolinera["Precio Gasolina 95 E5 Premium"].replace(",", "."),
            gasolinera["Precio Gasolina 98 E10"].replace(",", "."),
            gasolinera["Precio Gasolina 98 E5"].replace(",", "."),
            gasolinera["Precio Hidrogeno"].replace(",", "."),
          ],
        };
        data.push(gas);
      });
      spatial = new kdbush(
        data,
        (p) => p.lat,
        (p) => p.long
      );
      console.log("Data loaded");
      setTimeout(function () {
        updateData();
      }, 3600000);
      fs.writeFile(file, JSON.stringify(data), "utf8", function (err) {
        if (err) {
          console.log("An error occured while writing JSON Object to File.");
          console.log(err);
        } else {
          console.log("JSON file has been saved.");
        }
      });
    })
    .catch((error) => {
      console.log(error);
    });
}
