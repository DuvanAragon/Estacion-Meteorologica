const SUPABASE_URL =
  "https://imjfsbbmyhwpjiivhjwl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_mRzzlWUdktiy2mYBIsXp-A_BTyCv_W0";

const DISPOSITIVO =
  "esp32-c3-01";


const dashboard =
  document.getElementById("dashboard");

const estado =
  document.getElementById("estado");

const selectorPeriodo =
  document.getElementById("periodo");


let graficas = [];


// =====================================================
// CARGAR DASHBOARD
// =====================================================

async function cargarDashboard() {

  try {

    estado.textContent =
      "Actualizando datos...";


    const horas =
      Number(selectorPeriodo.value);


    const fechaInicio =
      new Date(
        Date.now()
        -
        horas * 60 * 60 * 1000
      );


    const datos =
      await obtenerLecturas(
        fechaInicio
      );


    if (datos.length === 0) {

      dashboard.innerHTML = "";

      estado.textContent =
        "No hay datos disponibles para este periodo.";

      return;

    }


    construirDashboard(datos);


    estado.textContent =
      "Datos actualizados";

  }

  catch (error) {

    console.error(error);

    estado.textContent =
      "Error al consultar los datos.";

  }

}


// =====================================================
// OBTENER TODAS LAS LECTURAS
// =====================================================

async function obtenerLecturas(fechaInicio) {

  const resultados = [];

  const cantidadPagina = 1000;

  let inicio = 0;


  while (true) {

    const fin =
      inicio
      +
      cantidadPagina
      -
      1;


    const url =
      `${SUPABASE_URL}/rest/v1/lecturas`
      +
      `?select=sensor,variable,valor,unidad,created_at`
      +
      `&dispositivo=eq.${encodeURIComponent(DISPOSITIVO)}`
      +
      `&created_at=gte.${encodeURIComponent(fechaInicio.toISOString())}`
      +
      `&order=created_at.asc`;


    const respuesta =
      await fetch(
        url,
        {
          headers: {

            "apikey":
              SUPABASE_KEY,

            "Range":
              `${inicio}-${fin}`

          }
        }
      );


    if (!respuesta.ok) {

      throw new Error(
        "Error consultando Supabase"
      );

    }


    const pagina =
      await respuesta.json();


    resultados.push(
      ...pagina
    );


    if (
      pagina.length
      <
      cantidadPagina
    ) {

      break;

    }


    inicio +=
      cantidadPagina;

  }


  return resultados;

}


// =====================================================
// CONSTRUIR DASHBOARD
// =====================================================

function construirDashboard(datos) {

  destruirGraficas();

  dashboard.innerHTML = "";


  const grupos = {};


  datos.forEach(lectura => {

    const clave =
      lectura.sensor
      +
      "|"
      +
      lectura.variable
      +
      "|"
      +
      lectura.unidad;


    if (!grupos[clave]) {

      grupos[clave] = {
        sensor:
          lectura.sensor,

        variable:
          lectura.variable,

        unidad:
          lectura.unidad,

        lecturas: []
      };

    }


    grupos[clave]
      .lecturas
      .push(lectura);

  });


  Object
    .values(grupos)
    .forEach(grupo => {

      crearSensor(grupo);

    });

}


// =====================================================
// CREAR SENSOR
// =====================================================

function crearSensor(grupo) {

  const lecturas =
    grupo.lecturas;


  if (
    lecturas.length === 0
  ) {

    return;

  }


  const valores =
    lecturas.map(
      lectura =>
        Number(lectura.valor)
    );


  const actual =
    valores[
      valores.length - 1
    ];


  const minimo =
    Math.min(...valores);


  const maximo =
    Math.max(...valores);


  const promedio =
    valores.reduce(
      (suma, valor) =>
        suma + valor,
      0
    )
    /
    valores.length;


  const ultimaLectura =
    lecturas[
      lecturas.length - 1
    ];


  const contenedor =
    document.createElement("article");


  contenedor.className =
    "sensor";


  const canvasID =
    "grafica-"
    +
    Math.random()
      .toString(36)
      .substring(2);


  contenedor.innerHTML = `

    <div class="sensor-header">

      <div>

        <h2>
          ${formatearNombre(grupo.variable)}
        </h2>

        <div class="nombre-sensor">
          ${grupo.sensor}
        </div>

      </div>

      <div class="valor-actual">

        ${formatearNumero(actual)}

        ${grupo.unidad}

      </div>

    </div>


    <div class="estadisticas">

      <div class="estadistica">

        <span class="titulo">
          Mínimo
        </span>

        <span class="valor">

          ${formatearNumero(minimo)}

          ${grupo.unidad}

        </span>

      </div>


      <div class="estadistica">

        <span class="titulo">
          Promedio
        </span>

        <span class="valor">

          ${formatearNumero(promedio)}

          ${grupo.unidad}

        </span>

      </div>


      <div class="estadistica">

        <span class="titulo">
          Máximo
        </span>

        <span class="valor">

          ${formatearNumero(maximo)}

          ${grupo.unidad}

        </span>

      </div>

    </div>


    <div class="grafica">

      <canvas
        id="${canvasID}">
      </canvas>

    </div>


    <div class="ultima-actualizacion">

      Última actualización:

      ${formatearFecha(
        ultimaLectura.created_at
      )}

    </div>

  `;


  dashboard.appendChild(
    contenedor
  );


  crearGrafica(
    canvasID,
    grupo
  );

}


// =====================================================
// CREAR GRÁFICA
// =====================================================

function crearGrafica(
  canvasID,
  grupo
) {

  const datosReducidos =
    reducirDatos(
      grupo.lecturas,
      150
    );


  const etiquetas =
    datosReducidos.map(
      lectura =>
        formatearHora(
          lectura.created_at
        )
    );


  const valores =
    datosReducidos.map(
      lectura =>
        Number(
          lectura.valor
        )
    );


  const canvas =
    document.getElementById(
      canvasID
    );


  const grafica =
    new Chart(
      canvas,
      {

        type: "line",

        data: {

          labels:
            etiquetas,

          datasets: [

            {

              label:
                formatearNombre(
                  grupo.variable
                ),

              data:
                valores,

              borderWidth:
                2,

              pointRadius:
                0,

              pointHoverRadius:
                4,

              tension:
                0.25

            }

          ]

        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


          interaction: {

            intersect:
              false,

            mode:
              "index"

          },


          plugins: {

            legend: {
              display:
                false
            }

          },


          scales: {

            x: {

              ticks: {

                maxTicksLimit:
                  8

              }

            },


            y: {

              title: {

                display:
                  true,

                text:
                  grupo.unidad

              }

            }

          }

        }

      }
    );


  graficas.push(
    grafica
  );

}


// =====================================================
// REDUCIR PUNTOS DE LA GRÁFICA
// =====================================================

function reducirDatos(
  datos,
  maximoPuntos
) {

  if (
    datos.length
    <=
    maximoPuntos
  ) {

    return datos;

  }


  const resultado = [];

  const salto =
    datos.length
    /
    maximoPuntos;


  for (
    let i = 0;
    i < maximoPuntos;
    i++
  ) {

    const indice =
      Math.floor(
        i * salto
      );


    resultado.push(
      datos[indice]
    );

  }


  resultado.push(
    datos[
      datos.length - 1
    ]
  );


  return resultado;

}


// =====================================================
// DESTRUIR GRÁFICAS ANTERIORES
// =====================================================

function destruirGraficas() {

  graficas.forEach(
    grafica =>
      grafica.destroy()
  );


  graficas = [];

}


// =====================================================
// FORMATO DEL NOMBRE
// =====================================================

function formatearNombre(nombre) {

  const texto =
    nombre
      .replaceAll("_", " ");


  return (
    texto.charAt(0)
      .toUpperCase()
    +
    texto.slice(1)
  );

}


// =====================================================
// FORMATO DE NÚMERO
// =====================================================

function formatearNumero(numero) {

  return Number(numero)
    .toFixed(1);

}


// =====================================================
// FORMATO DE FECHA
// =====================================================

function formatearFecha(fecha) {

  return new Date(fecha)
    .toLocaleString(
      "es-CO",
      {
        dateStyle:
          "short",

        timeStyle:
          "medium"
      }
    );

}


// =====================================================
// FORMATO DE HORA
// =====================================================

function formatearHora(fecha) {

  return new Date(fecha)
    .toLocaleTimeString(
      "es-CO",
      {
        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    );

}


// =====================================================
// CAMBIO DE PERIODO
// =====================================================

selectorPeriodo
  .addEventListener(
    "change",
    cargarDashboard
  );


// =====================================================
// PRIMERA CARGA
// =====================================================

cargarDashboard();


// =====================================================
// ACTUALIZAR CADA 30 SEGUNDOS
// =====================================================

setInterval(
  cargarDashboard,
  30000
);