# Vercel Compatibility Fix - December 22, 2025

## Problem
Product update API was failing on Vercel with error:
```
ENOENT: no such file or directory, mkdir '/var/task/uploads'
```

## Root Cause
The application was trying to create temp directories (`uploads/temp`) to store files before uploading to Cloudinary. This fails on Vercel because:
- **Vercel uses serverless functions with read-only filesystem**
- Only `/tmp` directory is writable, but it's limited and ephemeral
- The application was trying to write to `/var/task/uploads` which is not allowed

## Solution
Changed all file upload APIs to **pass buffers directly to Cloudinary** without creating temp files.

The `uploadToCloudinary` service already supported buffer uploads (lines 47-56 in `cloudinaryService.js`):
```javascript
if (file.buffer) {
  // Upload from buffer directly
  result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      cloudinaryOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}
```

## Files Modified

### 1. **src/app/api/product/[updateId]/route.js**
- ❌ Removed: `mkdir` temp directory creation
- ❌ Removed: Imports for `writeFile`, `mkdir`, `join`, `existsSync`, `path`
- ✅ Changed: Pass buffer directly to `uploadToCloudinary`

**Before:**
```javascript
const uploadDir = join(process.cwd(), "uploads", "temp");
if (!existsSync(uploadDir)) {
  await mkdir(uploadDir, { recursive: true });
}
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);
// ...save to temp file...
const uploadResult = await uploadToCloudinary([{ path: tempPath, ... }], "products");
```

**After:**
```javascript
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);
// Upload directly with buffer (no temp files needed for Vercel)
const uploadResult = await uploadToCloudinary(
  [{ buffer, originalname: file.name }],
  "products"
);
```

### 2. **src/app/api/vendor/product/route.js**
- ❌ Removed: `mkdir` temp directory creation
- ❌ Removed: `writeFile` to temp path
- ❌ Removed: Imports for `writeFile`, `mkdir`, `join`, `existsSync`, `path`
- ✅ Changed: Pass buffer directly to `uploadToCloudinary`

### 3. **src/app/api/attachment/route.js**
- ❌ Removed: `mkdir` temp directory creation
- ❌ Removed: `writeFile` loop
- ❌ Removed: Imports for `writeFile`, `mkdir`, `join`, `existsSync`
- ✅ Changed: Prepare files with buffers instead of temp file paths

**Before:**
```javascript
const tempDir = join(process.cwd(), 'uploads', 'temp');
if (!existsSync(tempDir)) {
  await mkdir(tempDir, { recursive: true });
}

for (const file of files) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = join(tempDir, fileName);
  await writeFile(filePath, buffer);
  
  tempFiles.push({ path: filePath, originalname: file.name, ... });
}
```

**After:**
```javascript
for (const file of files) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  tempFiles.push({ buffer, originalname: file.name, ... });
}
```

## Testing Checklist
- [ ] Test product update with image upload on Vercel
- [ ] Test vendor product creation with thumbnail on Vercel
- [ ] Test attachment upload on Vercel
- [ ] Verify images appear correctly after upload
- [ ] Test localhost to ensure no regression

## Benefits
✅ **Vercel Compatible**: No filesystem operations needed
✅ **Faster**: No disk I/O for temp files
✅ **Cleaner**: Simpler code without temp file management
✅ **More Reliable**: No cleanup needed, no orphaned temp files

## Deployment Notes
After deploying these changes to Vercel:
1. The product update API will work correctly
2. All file uploads go directly to Cloudinary via buffers
3. No `/var/task/uploads` errors
4. Both localhost and Vercel will use the same buffer-based upload approach

## Environment Variables Required
Make sure these are set in Vercel:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
