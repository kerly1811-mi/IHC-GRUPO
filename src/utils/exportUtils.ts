import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisHistoryItem } from '../models/usabilityModels';

/**
 * Forja la descarga de un archivo de texto/blob
 */
const downloadFile = (content: string | Blob, fileName: string, contentType: string) => {
  try {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (error) {
    console.error('Error in downloadFile:', error);
  }
};

/**
 * Exporta un análisis a formato Markdown
 */
export const exportToMarkdown = (item: AnalysisHistoryItem) => {
  try {
    const { result_data: res, project_name, created_at, title } = item;
    const dateStr = new Date(created_at).toLocaleString();
    
    let md = `---\n`;
    md += `title: "Reporte de Usabilidad: ${title || project_name}"\n`;
    md += `project: "${project_name}"\n`;
    md += `date: "${dateStr}"\n`;
    md += `score: ${res.priorityScore.toFixed(1)}\n`;
    md += `---\n\n`;

    md += `# 📊 Reporte de Usabilidad: ${title || project_name}\n\n`;
    md += `**Proyecto:** \`${project_name}\` | **Fecha:** \`${dateStr}\` | **Puntuación:** ⭐ \`${res.priorityScore.toFixed(1)}/10\`\n\n`;
    
    md += `## 📝 Resumen Ejecutivo\n`;
    md += `> ${res.summary}\n\n`;
    
    md += `## 📈 Métricas Clave\n\n`;
    
    // Gráfico Mermaid para Markdown Preview Enhanced
    md += `\`\`\`mermaid\n`;
    md += `pie title Distribución de Hallazgos\n`;
    md += `  "Críticos": ${res.criticalIssues.length}\n`;
    md += `  "Mejoras Sugeridas": ${res.recommendations.length}\n`;
    md += `  "Problemas WCAG": ${res.accessibilityIssues.length}\n`;
    md += `\`\`\`\n\n`;

    // Tabla de resumen
    md += `| Métrica | Cantidad | Descripción |\n`;
    md += `| :--- | :---: | :--- |\n`;
    md += `| 🚨 **Problemas Críticos** | **${res.criticalIssues.length}** | Fallos severos de usabilidad |\n`;
    md += `| 💡 **Plan de Mejora** | **${res.recommendations.length}** | Oportunidades de optimización |\n`;
    md += `| ♿ **Hallazgos WCAG** | **${res.accessibilityIssues.length}** | Problemas de accesibilidad |\n`;
    md += `| 🔍 **Confianza del Análisis** | **${res.analysisMetadata.confidence}** | Fiabilidad estimada por IA |\n\n`;

    if (res.criticalIssues.length > 0) {
      md += `## 🚨 Hallazgos Críticos\n\n`;
      res.criticalIssues.forEach((issue, i) => {
        md += `### ${i + 1}. ${issue.title}\n\n`;
        md += `| Severidad | Heurística |\n`;
        md += `| :---: | :--- |\n`;
        md += `| 🔴 \`${issue.severity}\` | *${issue.heuristic}* |\n\n`;
        md += `> [!WARNING]\n`;
        md += `> **Descripción del Problema:**\n`;
        md += `> ${issue.description.replace(/\n/g, '\n> ')}\n\n`;
        md += `**💡 Recomendación:**  \n${issue.recommendation}\n\n`;
        md += `---\n\n`;
      });
    }

    if (res.recommendations.length > 0) {
      md += `## 🌱 Plan de Mejora\n\n`;
      res.recommendations.forEach((sol, i) => {
        md += `### ${i + 1}. ${sol.title}\n\n`;
        md += `| Prioridad | Esfuerzo | Impacto |\n`;
        md += `| :---: | :---: | :---: |\n`;
        md += `| \`${sol.priority}\` | \`${sol.effort}\` | \`${sol.impact}\` |\n\n`;
        md += `> [!TIP]\n`;
        md += `> **Propuesta:**\n`;
        md += `> ${sol.description.replace(/\n/g, '\n> ')}\n\n`;
        md += `**📌 Justificación:**  \n${sol.rationale}\n\n`;
        md += `---\n\n`;
      });
    }

    if (res.accessibilityIssues.length > 0) {
      md += `## ♿ Accesibilidad (WCAG)\n\n`;
      res.accessibilityIssues.forEach((finding, i) => {
        md += `### ${i + 1}. ${finding.criterion}\n\n`;
        md += `- **Nivel de Conformidad:** \`${finding.level}\`\n\n`;
        md += `> [!IMPORTANT]\n`;
        md += `> **Descripción:**\n`;
        md += `> ${finding.description.replace(/\n/g, '\n> ')}\n\n`;
        md += `**🔧 Sugerencia:**  \n${finding.recommendation}\n\n`;
        md += `---\n\n`;
      });
    }

    md += `\n*Generado automáticamente por **Gemini AI Analysis Suite***`;

    const fileName = `analisis-${(title || project_name).toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.md`;
    downloadFile(md, fileName, 'text/markdown');
  } catch (error) {
    console.error('Error exporting to Markdown:', error);
    alert('Hubo un error al generar el archivo Markdown.');
  }
};

/**
 * Exporta un análisis a formato PDF usando jsPDF
 */
// Extensión de tipos para plugins de jsPDF
interface JsPDFCustom extends jsPDF {
  lastAutoTable: { finalY: number };
  internal: jsPDF['internal'] & { getNumberOfPages: () => number };
}

export const exportToPDF = (item: AnalysisHistoryItem) => {
  console.log('Iniciando exportación a PDF...', item);
  try {
    const { result_data: res, project_name, created_at, title } = item;
    const doc = new jsPDF() as JsPDFCustom;
    const dateStr = new Date(created_at).toLocaleString();

    // Colores corporativos modernos
    const NAVY = [15, 23, 42]; // slate-900
    const SLATE = [51, 65, 85]; // slate-700
    const LIGHT_SLATE = [100, 116, 139]; // slate-500
    const ACCENT = [59, 130, 246]; // blue-500

    // Cabecera Principal (Estilo banner minimalista)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 0, 210, 45, 'F');
    
    // Línea de acento superior
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(0, 0, 210, 2, 'F');

    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE USABILIDAD IA', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(LIGHT_SLATE[0], LIGHT_SLATE[1], LIGHT_SLATE[2]);
    doc.text('Gemini AI Analysis Suite', 20, 32);

    // Información del Proyecto
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title || project_name, 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    doc.text(`Proyecto: ${project_name}   |   Fecha: ${dateStr}`, 20, 62);

    // Cajas de estadísticas
    let currentY = 72;
    const boxWidth = 38;
    const boxHeight = 22;
    const gap = (170 - (4 * boxWidth)) / 3;

    const drawStatBox = (x: number, statTitle: string, value: string, color: number[]) => {
      doc.setFillColor(255, 255, 255); // white
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');
      
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + boxWidth / 2, currentY + 11, { align: 'center' });
      
      doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(statTitle, x + boxWidth / 2, currentY + 17, { align: 'center' });
    };

    drawStatBox(20, 'PROBLEMAS', res.criticalIssues.length.toString(), [220, 38, 38]); // red-600
    drawStatBox(20 + boxWidth + gap, 'SOLUCIONES', res.recommendations.length.toString(), [16, 185, 129]); // emerald-500
    drawStatBox(20 + 2 * (boxWidth + gap), 'WCAG', res.accessibilityIssues.length.toString(), [124, 58, 237]); // violet-600
    drawStatBox(20 + 3 * (boxWidth + gap), 'PUNTUACIÓN', res.priorityScore.toFixed(1), [245, 158, 11]); // amber-500

    currentY += boxHeight + 12;

    // Resumen Ejecutivo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('RESUMEN EJECUTIVO', 20, currentY);
    currentY += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    const splitSummary = doc.splitTextToSize(res.summary, 170);
    doc.text(splitSummary, 20, currentY);

    currentY += (splitSummary.length * 5) + 12;

    // Función auxiliar para títulos de sección
    const drawSectionTitle = (sectionTitle: string, color: number[]) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(sectionTitle, 20, currentY);
      currentY += 5;
    };

    // Tabla de Hallazgos Críticos
    if (res.criticalIssues.length > 0) {
      drawSectionTitle('HALLAZGOS CRÍTICOS', [220, 38, 38]); // red-600

      autoTable(doc, {
        startY: currentY,
        head: [['Hallazgo / Detalle', 'Severidad', 'Heurística']],
        body: res.criticalIssues.map(i => [
          `${i.title}\n\n${i.description}\n\nRecomendación: ${i.recommendation}`,
          i.severity,
          i.heuristic
        ]),
        theme: 'grid',
        headStyles: { fillColor: [254, 242, 242], textColor: [185, 28, 28], fontStyle: 'bold', lineColor: [252, 165, 165], lineWidth: 0.1 },
        bodyStyles: { textColor: [51, 65, 85], lineColor: [226, 232, 240] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        styles: { fontSize: 9, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 100 } },
        margin: { left: 20, right: 20 }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // Tabla de Recomendaciones
    if (res.recommendations.length > 0) {
      drawSectionTitle('PLAN DE MEJORA', [5, 150, 105]); // emerald-600

      autoTable(doc, {
        startY: currentY,
        head: [['Recomendación / Justificación', 'Prioridad', 'Esfuerzo', 'Impacto']],
        body: res.recommendations.map(r => [
          `${r.title}\n\n${r.description}\n\nJustificación: ${r.rationale}`,
          r.priority,
          r.effort,
          r.impact
        ]),
        theme: 'grid',
        headStyles: { fillColor: [236, 253, 245], textColor: [4, 120, 87], fontStyle: 'bold', lineColor: [167, 243, 208], lineWidth: 0.1 },
        bodyStyles: { textColor: [51, 65, 85], lineColor: [226, 232, 240] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        styles: { fontSize: 9, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 90 } },
        margin: { left: 20, right: 20 }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // Tabla de Accesibilidad
    if (res.accessibilityIssues.length > 0) {
      drawSectionTitle('ACCESIBILIDAD WCAG', [124, 58, 237]); // violet-600

      autoTable(doc, {
        startY: currentY,
        head: [['Criterio / Descripción', 'Nivel', 'Sugerencia']],
        body: res.accessibilityIssues.map(a => [
          `${a.criterion}\n\n${a.description}`,
          a.level,
          a.recommendation
        ]),
        theme: 'grid',
        headStyles: { fillColor: [243, 232, 255], textColor: [109, 40, 217], fontStyle: 'bold', lineColor: [216, 180, 254], lineWidth: 0.1 },
        bodyStyles: { textColor: [51, 65, 85], lineColor: [226, 232, 240] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        styles: { fontSize: 9, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 100 } },
        margin: { left: 20, right: 20 }
      });
    }

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(LIGHT_SLATE[0], LIGHT_SLATE[1], LIGHT_SLATE[2]);
      
      // Línea separadora
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 280, 190, 280);

      doc.text(`Página ${i} de ${pageCount}`, 105, 286, { align: 'center' });
      doc.text('Confidencial - Reporte Generado por Sistema IHC', 20, 286);
      doc.text('Gemini AI Analysis Suite', 190, 286, { align: 'right' });
    }

    const fileName = `analisis-${(title || project_name).toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
    console.log('Guardando PDF:', fileName);
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Hubo un error al generar el archivo PDF. Revisa la consola para más detalles.');
  }
};

