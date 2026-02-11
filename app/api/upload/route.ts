import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const userId = formData.get("userId") as string;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Créer le dossier uploads/userId si nécessaire
    const uploadDir = path.join(process.cwd(), "public", "uploads", userId);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large (max 10MB)` },
          { status: 400 }
        );
      }

      // Vérifier le type de fichier
      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }

      // Générer un nom de fichier unique si nécessaire
      let fileName = file.name;
      let filePath = path.join(uploadDir, fileName);
      let counter = 1;

      while (existsSync(filePath)) {
        const ext = path.extname(file.name);
        const nameWithoutExt = path.basename(file.name, ext);
        fileName = `${nameWithoutExt}_${counter}${ext}`;
        filePath = path.join(uploadDir, fileName);
        counter++;
      }

      // Convertir le fichier en buffer et le sauvegarder
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      uploadedFiles.push({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: `/uploads/${userId}/${fileName}`,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
