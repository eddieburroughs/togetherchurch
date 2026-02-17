import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const MM_TO_PT = 2.83465;

interface LabelData {
  childName: string;
  sessionName: string;
  date: string;
  pickupCode: string;
  allergies: string | null;
}

interface LayoutField {
  key: string;
  x: number;
  y: number;
  fontSize: number;
  bold?: boolean;
}

interface LabelLayout {
  fields: LayoutField[];
}

/**
 * Generate a PDF with labels for checked-in kids.
 * Each label is on its own page at the specified dimensions.
 */
export async function generateLabelsPdf(
  widthMm: number,
  heightMm: number,
  layout: LabelLayout,
  labels: LabelData[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = widthMm * MM_TO_PT;
  const pageHeight = heightMm * MM_TO_PT;

  for (const label of labels) {
    const page = doc.addPage([pageWidth, pageHeight]);

    const values: Record<string, string> = {
      child_name: label.childName,
      session_name: label.sessionName,
      date: label.date,
      pickup_code: label.pickupCode,
      pickup_label: "PICKUP CODE",
      allergies: label.allergies ? `Allergies: ${label.allergies}` : "",
      allergies_flag: label.allergies ? "⚠ ALLERGY" : "",
    };

    for (const field of layout.fields) {
      const text = values[field.key] ?? "";
      if (!text) continue;

      const selectedFont = field.bold ? fontBold : font;
      const x = field.x * MM_TO_PT;
      // PDF coordinates are from bottom-left; layout y is from top
      const y = pageHeight - field.y * MM_TO_PT - field.fontSize * 0.75;

      page.drawText(text, {
        x,
        y,
        size: field.fontSize,
        font: selectedFont,
        color: field.key === "allergies_flag" ? rgb(0.8, 0, 0) : rgb(0, 0, 0),
      });
    }
  }

  return doc.save();
}
