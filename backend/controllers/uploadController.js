const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/db');

const uploadFile = async (req, res) => {
  try {
    const { name, type, base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ success: false, message: 'Harap berikan data gambar base64' });
    }

    // Clean up base64 metadata
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine file extension
    let ext = '.jpg';
    if (name) {
      ext = path.extname(name) || '.jpg';
    } else if (type) {
      const typeParts = type.split('/');
      if (typeParts[1]) ext = `.${typeParts[1]}`;
    }

    const filename = `movie_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;

    // 1. Try Supabase Storage if configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && supabase) {
      try {
        console.log(`📡 Attempting to upload ${filename} to Supabase bucket: movies`);
        const { data, error } = await supabase.storage
          .from('movies')
          .upload(filename, buffer, {
            contentType: type || 'image/jpeg',
            upsert: true
          });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('movies')
            .getPublicUrl(filename);

          console.log('📡 File uploaded to Supabase successfully:', publicUrl);
          return res.status(200).json({
            success: true,
            message: 'File berhasil diunggah ke Supabase',
            url: publicUrl
          });
        } else {
          console.warn('⚠️ Supabase upload returned error:', error.message);
          if (process.env.VERCEL) {
            return res.status(400).json({
              success: false,
              message: `Gagal mengunggah ke Supabase Storage: ${error.message}. Pastikan bucket 'movies' sudah dibuat dengan policy 'public upload' di Supabase.`
            });
          }
        }
      } catch (err) {
        console.warn('⚠️ Supabase upload exception:', err.message);
        if (process.env.VERCEL) {
          return res.status(500).json({
            success: false,
            message: `Exception Supabase Storage: ${err.message}`
          });
        }
      }
    }

    // 2. Fallback to local storage
    const isVercel = !!process.env.VERCEL;
    const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Return local URL
    const host = req.get('host');
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? req.protocol : 'https';
    const url = `${protocol}://${host}/uploads/${filename}`;

    console.log(`📡 File saved to ${isVercel ? 'Vercel /tmp' : 'local'} storage successfully:`, url);
    return res.status(200).json({
      success: true,
      message: isVercel ? 'File berhasil diunggah sementara ke Vercel /tmp' : 'File berhasil diunggah secara lokal',
      url
    });

  } catch (error) {
    console.error('❌ Upload controller error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadFile };
