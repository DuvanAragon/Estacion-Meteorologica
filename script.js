const SUPABASE_URL = "https://imjfsbbmyhwpjiivhjwl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_mRzzlWUdktiy2mYBIsXp-A_BTyCv_W0";


// Obtener la medición más reciente
async function obtenerDatos() {

  try {

    const respuesta = await fetch(
      `${SUPABASE_URL}/rest/v1/mediciones?select=temperatura,humedad,created_at&order=created_at.desc&limit=1`,
      {
        headers: {
          "apikey": SUPABASE_KEY
        }
      }
    );


    if (!respuesta.ok) {
      throw new Error("Error consultando Supabase");
    }


    const datos = await respuesta.json();


    // Si todavía no existen mediciones
    if (datos.length === 0) {

      document.getElementById("temperatura").textContent = "--";
      document.getElementById("humedad").textContent = "--";
      document.getElementById("fecha").textContent = "Sin datos";

      return;
    }


    const medicion = datos[0];


    // Mostrar temperatura
    document.getElementById("temperatura").textContent =
      Number(medicion.temperatura).toFixed(1);


    // Mostrar humedad
    document.getElementById("humedad").textContent =
      Number(medicion.humedad).toFixed(1);


    // Convertir fecha
    const fecha = new Date(medicion.created_at);


    document.getElementById("fecha").textContent =
      fecha.toLocaleString(
        "es-CO",
        {
          dateStyle: "short",
          timeStyle: "medium"
        }
      );

  }

  catch (error) {

    console.error(error);

    document.getElementById("temperatura").textContent = "--";
    document.getElementById("humedad").textContent = "--";
    document.getElementById("fecha").textContent =
      "Error de conexión";

  }

}


// Ejecutar al abrir la página
obtenerDatos();


// Actualizar automáticamente cada 5 segundos
setInterval(
  obtenerDatos,
  5000
);