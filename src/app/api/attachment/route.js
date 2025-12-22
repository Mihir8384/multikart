import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Attachment from "@/models/Attachment";
import { uploadToCloudinary } from "@/utils/cloudinary/cloudinaryService";

// GET - Fetch all attachments with pagination
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const paginate = parseInt(searchParams.get('paginate')) || 50;
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'desc';
    const mime_type = searchParams.get('mime_type') || '';
    
    const skip = (page - 1) * paginate;
    
    // Build query
    let query = {};
    if (search) {
      query.file_name = { $regex: search, $options: 'i' };
    }
    if (mime_type) {
      const mimeTypes = mime_type.split(',');
      query.mime_type = { $in: mimeTypes };
    }
    
    // Get total count
    const total = await Attachment.countDocuments(query);
    
    // Fetch attachments with pagination
    const attachments = await Attachment.find(query)
      .sort({ created_at: sort === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(paginate);
    
    // Transform data to include id field
    const transformedData = attachments.map(att => ({
      ...att.toObject(),
      id: att._id.toString()
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        data: transformedData,
        current_page: page,
        per_page: paginate,
        total: total,
        last_page: Math.ceil(total / paginate)
      }
    });
    
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch attachments",
      error: error.message
    }, { status: 500 });
  }
}

// POST - Upload attachments
export async function POST(request) {
  try {
    await dbConnect();
    
    console.log("📥 Received upload request");
    
    const formData = await request.formData();
    console.log("📥 FormData received");
    
    // Log all form data entries
    for (const [key, value] of formData.entries()) {
      console.log(`📥 FormData entry: ${key} =`, value instanceof File ? `File: ${value.name}` : value);
    }
    
    const files = formData.getAll('attachments');
    console.log("📥 Files extracted:", files.length, "files");
    
    if (!files || files.length === 0) {
      console.error("❌ No files found in FormData");
      return NextResponse.json({
        success: false,
        message: "No files provided"
      }, { status: 400 });
    }
    
    console.log("📥 Files to process:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // Prepare files with buffers for Cloudinary upload (Vercel compatible)
    const tempFiles = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      tempFiles.push({
        buffer,
        originalname: file.name,
        mimetype: file.type,
        size: file.size
      });
    }
    
    console.log("☁️ Uploading to Cloudinary...");
    // Upload to Cloudinary
    const cloudinaryResults = await uploadToCloudinary(tempFiles, 'attachments');
    console.log("✅ Cloudinary upload complete:", cloudinaryResults.length, "files");
    
    // Save to database
    const attachments = await Promise.all(
      cloudinaryResults.map(async (result, index) => {
        const attachment = new Attachment({
          file_name: tempFiles[index].originalname,
          original_url: result.secure_url,
          mime_type: tempFiles[index].mimetype,
          file_size: tempFiles[index].size,
          width: result.width || null,
          height: result.height || null,
          public_id: result.public_id,
          resource_type: result.resource_type,
          folder: result.folder || 'attachments'
        });
        
        await attachment.save();
        console.log("💾 Saved to database:", attachment._id);
        return {
          ...attachment.toObject(),
          id: attachment._id.toString()
        };
      })
    );
    
    console.log("✅ Upload complete:", attachments.length, "attachments saved");
    
    return NextResponse.json({
      success: true,
      message: "Files uploaded successfully",
      data: attachments
    }, { status: 201 });
    
  } catch (error) {
    console.error("❌ Error uploading attachments:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to upload attachments",
      error: error.message
    }, { status: 500 });
  }
}
