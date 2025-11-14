const API_KEY = "AIzaSyAHk7_-ttlflyuQ_DywlEc1aXPeFUzdHcw";
const MODEL = "gemini-2.0-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

let correctas = 0;
let incorrectas = 0;
let ultimaPregunta = ""; 

async function generarPreguntaFutbol() {
  const prompt = `
Eres un experto en fútbol. Genera una pregunta de opción múltiple (nivel intermedio) para un quiz sobre fútbol.
Debe ser diferente a preguntas anteriores, sobre historia, jugadores, mundiales o reglas.
Devuelve SOLO el siguiente JSON y nada más:
{
  "question": "Texto de la pregunta",
  "options": ["a) Opción 1", "b) Opción 2", "c) Opción 3", "d) Opción 4"],
  "correct_answer": "b) Opción 2",
  "explanation": "Breve explicación del por qué es la correcta."
}
No repitas esta pregunta: "${ultimaPregunta}".
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    const jsonText = text.substring(start, end);

    const pregunta = JSON.parse(jsonText);
    ultimaPregunta = pregunta.question;

    return pregunta;
  } catch (err) {
    console.error("Error generando pregunta:", err);
    return null;
  }
}

async function cargarPregunta() {
  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");
  const nextBtn = document.getElementById("nextBtn");


  questionEl.textContent = "Cargando nueva pregunta...";
  optionsEl.innerHTML = "";
  nextBtn.style.display = "none";


  let pregunta = null;
  for (let i = 0; i < 3; i++) {
    pregunta = await generarPreguntaFutbol();
    if (pregunta && pregunta.question !== ultimaPregunta) break;
  }

  if (!pregunta) {
    questionEl.textContent = "Error al generar pregunta. Intenta de nuevo.";
    return;
  }

  questionEl.textContent = pregunta.question;

  pregunta.options.forEach(op => {
    const btn = document.createElement("button");
    btn.classList.add("btn", "btn-outline-light", "my-1");
    btn.textContent = op;
    btn.onclick = () => verificarRespuesta(op, pregunta.correct_answer, pregunta.explanation);
    optionsEl.appendChild(btn);
  });
}

function verificarRespuesta(opcionSeleccionada, respuestaCorrecta, explicacion) {
  const opciones = document.querySelectorAll("#options button");
  const nextBtn = document.getElementById("nextBtn");
  const container = document.getElementById("question-container");


  const prevExp = container.querySelector(".explicacion");
  if (prevExp) prevExp.remove();

  opciones.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === respuestaCorrecta) {
      btn.classList.replace("btn-outline-light", "btn-success");
    } else if (btn.textContent === opcionSeleccionada && opcionSeleccionada !== respuestaCorrecta) {
      btn.classList.replace("btn-outline-light", "btn-danger");
    }
  });

  if (opcionSeleccionada === respuestaCorrecta) {
    correctas++;
  } else {
    incorrectas++;
  }

  document.getElementById("correctas").textContent = correctas;
  document.getElementById("incorrectas").textContent = incorrectas;

  guardarProgreso();


  const exp = document.createElement("p");
  exp.className = "mt-3 text-info explicacion";
  exp.innerHTML = `<strong>Explicación:</strong> ${explicacion}`;
  container.appendChild(exp);

  
  nextBtn.style.display = "inline-block";
  nextBtn.onclick = cargarPregunta;
}


function guardarProgreso() {
  const progreso = {
    correctas: correctas,
    incorrectas: incorrectas
  };
  localStorage.setItem("progresoFutbol", JSON.stringify(progreso));
}

function cargarProgreso() {
  const data = localStorage.getItem("progresoFutbol");
  if (data) {
    const progreso = JSON.parse(data);
    correctas = progreso.correctas || 0;
    incorrectas = progreso.incorrectas || 0;
  } else {
    correctas = 0;
    incorrectas = 0;
  }

  document.getElementById("correctas").textContent = correctas;
  document.getElementById("incorrectas").textContent = incorrectas;
}

window.onload = () => {
  cargarProgreso(); 
  cargarPregunta();
};

