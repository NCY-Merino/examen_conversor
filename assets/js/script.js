
let monedas = [];

window.onload = function () {
    getData();
}

const ctx = document.getElementById('myChart');
const mensajeError = document.getElementById("mensaje-error");
const graficoDiv = document.getElementById("contenedor-chart");
const monedaCambios = document.getElementById("moneda-cambios");
const pesosClp = document.getElementById("pesos-clp");
const totalSpan = document.getElementById("total");

let total = 0;
let grafico = undefined;

async function getData() {
    const url = "https://mindicador.cl/api/";
    mensajeError.innerText = '';
    mensajeError.classList.remove('error');
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
            mensajeError.classList.add('error');
            mensajeError.innerText = response.message;
        }

        const json = await response.json();
        ordenarMonedas(json);
    } catch (error) {
        console.error(error.message);
        mensajeError.classList.add('error');
        mensajeError.innerText = response.message;
    }
}

function ordenarMonedas(json) {
    for (var i in json) {
        if (json[i].codigo) {
            monedas.push(json[i]);
            const newOption = document.createElement('option');
            newOption.value = json[i].codigo;
            newOption.innerText = json[i].nombre;
            monedaCambios.appendChild(newOption);
        }
    }
}

async function convertir() {
    mensajeError.innerText = '';
    mensajeError.classList.remove('error');

    if (grafico !== undefined) {
        grafico.destroy();
        graficoDiv.classList.remove('view');
    }

    if (!pesosClp.value || !monedaCambios.value) {
        mensajeError.classList.add('error');
        if (!pesosClp.value && !monedaCambios.value) {
            mensajeError.innerText = 'Debes ingresar un monto en CLP y seleccionar un tipo de moneda';
        } else if (!pesosClp.value) {
            mensajeError.innerText = 'Debes ingresar un monto en CLP';
        } else if (!monedaCambios.value) {
            mensajeError.innerText = 'Seleccionar un tipo de moneda';
        }
        return
    };

    const tipoMoneda = monedaCambios.value;
    const url = `https://mindicador.cl/api/${tipoMoneda}`;
    const monedaSeleccionada = monedas.find(x => x.codigo === tipoMoneda);

    total = pesosClp.value * monedaSeleccionada.valor;
    let precio = '';
    if (monedaSeleccionada.unidad_medida !== "Porcentaje") {
        const valor = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
            total
        );
        precio = `Resultado: ${valor} ${monedaSeleccionada.unidad_medida}`;
    } else {
        precio = `Resultado: ${total}%`;
    }
    totalSpan.innerText = `${precio}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
            mensajeError.classList.add('error');
            mensajeError.innerText = response.message;
        }
        const json = await response.json();
        crearGrafico(json);
    } catch (error) {
        console.error(error.message);
        mensajeError.classList.add('error');
        mensajeError.innerText = response.message;
    }

}

function crearGrafico(datos) {
    console.error('Datos', datos);
    let dias = [];
    let valores = [];
    graficoDiv.classList.add('view');


    for (let i = 0; i < 10; i++) {
        const fechaInicial = datos.serie[i].fecha;
        const fechaUTC = new Date(fechaInicial);

        const options = {
            timeZone: 'America/Santiago',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        const fecha = new Intl.DateTimeFormat(options).format(fechaUTC);

        dias.push(fecha);
        valores.push(datos.serie[i].valor);
    }

    const data = {
        labels: dias.reverse(),
        datasets: [
            {
                label: `Unidad medida (${datos.unidad_medida})`,
                data: valores.reverse(),
                pointRadius: 5,
                pointHoverRadius: 10
            }
        ]
    };


    grafico = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: (ctx) => datos.nombre,
                }
            }
        }
    });
}