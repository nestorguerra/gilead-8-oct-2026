/*
 * Datos de la jornada. Fuente única: «CMm HER2- en tiempos de IA_Agenda preliminar Jornada II.docx».
 * Los textos se copian literalmente del Word. Solo se añaden campos técnicos:
 * identificadores, fecha ISO y desfase horario (Europe/Madrid, horario de verano el 8/10/2026 = +02:00).
 */
window.JORNADA = {
  titulo: "CMm HER2- EN TIEMPOS DE IA",
  subtitulo: "Jornada II - TRODELVY en CMm HR+HER2-",
  fechaTexto: "Jueves 8 de octubre de 2026",
  fechaISO: "2026-10-08",
  zonaHoraria: "Europe/Madrid",
  desfase: "+02:00",
  lugar: {
    hotel: "Hotel The Westin Madrid Cuzco",
    direccion: "P.º de la Castellana, 133, Tetuán, 28046 Madrid"
  },
  ponentes: [
    { id: "maria-gion", nombre: "Dra. María Gión Cortés", cargo: "Oncología Médica, H.U. Ramón y Cajal" },
    { id: "alfonso-lopez-de-sa", nombre: "Dr. Alfonso López de Sa Lorenzo", cargo: "Oncología Médica, H. Clínico San Carlos" },
    { id: "coral-garcia-quevedo", nombre: "Dra. Coral García Quevedo Suero", cargo: "MIR Oncología Médica, H.U. Ramón y Cajal" },
    { id: "nestor-guerra", nombre: "Néstor Guerra", cargo: "Experto en IA y transformación digital aplicable a la Oncología Médica" }
  ],
  sesiones: [
    {
      n: 1, inicio: "18:00", fin: "18:05",
      titulo: "Bienvenida",
      ponentesTexto: "Dra. María Gión Cortés",
      ponentes: ["maria-gion"]
    },
    {
      n: 2, inicio: "18:05", fin: "18:35",
      titulo: "ADCs en CMm HR+ HER2-: ¿cuál, cuándo y por qué?",
      ponentesTexto: "Dr. Alfonso López de Sa Lorenzo",
      ponentes: ["alfonso-lopez-de-sa"]
    },
    {
      n: 3, inicio: "18:35", fin: "19:05",
      titulo: "Resolviendo un caso clínico de CMm HR+ HER2- con TRODELVY",
      ponentesTexto: "Dra. Coral García Quevedo Suero",
      ponentes: ["coral-garcia-quevedo"]
    },
    {
      n: 4, inicio: "19:05", fin: "20:10",
      titulo: "TALLER PRÁCTICO 2 – Oncología 2.0: crea tu propio agente de IA",
      ponentesTexto: "Néstor Guerra, Dra. María Gión Cortés",
      ponentes: ["nestor-guerra", "maria-gion"]
    },
    {
      n: 5, inicio: "20:10", fin: "20:15",
      titulo: "Conclusiones finales",
      ponentesTexto: "Dra. María Gión Cortés",
      ponentes: ["maria-gion"]
    }
  ]
};
