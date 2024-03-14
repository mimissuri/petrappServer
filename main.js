import kdbush from "kdbush";
import express from "express";
import axios from "axios";

var spatial = new kdbush(1);

var app = express();
var data = [];

app.set("port", process.env.PORT || 80);
app.set("json spaces", 1);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/* lat:Latitud
 * long:Longitud
 * d:Distancia
 * t:Tipo de combustible
 */
app.get("/getGasolineras/:lat/:long/:d/:t", (req, res) => {
  let dist = Math.min(req.params.d, 50000);
  let lat = parseFloat(req.params.lat);
  let long = parseFloat(req.params.long);
  var results = spatial.range(
    lat - dist / 111195,
    long - dist / 111195,
    lat + dist / 111195,
    long + dist / 111195
  );
  res.json(results.map((result) => data[result]));
});

app.get("/updateData", (req, res) => {
  updateData();
  res.json({ status: "ok" });
});

app.listen(app.get("port"), () => {
  console.log(`Server listening on port ${app.get("port")}`);
  updateData();
});

function updateData() {
  console.log("Loading data");
  const url =
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres";
  axios
    .get(url)
    .then((res) => {
      let json = res["data"];
      let gasolineras = json["ListaEESSPrecio"];
      data = [];
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
      spatial = new kdbush(data.length);
      for (var i = 0; i < data.length; i++) {
        spatial.add(data[i].lat, data[i].long);
      }
      spatial.finish();
      console.log("Data loaded");
    })
    .catch((error) => {
      console.log(error);
      updateData();
    });
}
