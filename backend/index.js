app.post("/upload", (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { file } = req.files;
    const { roomId } = req.body;

    const filePayload = {
      fileName: file.name,
      fileSize: file.size, // <-- Exact file size in bytes
      fileType: file.mimetype || file.name.split('.').pop(),
      fileData: `data:${file.mimetype};base64,${file.data.toString("base64")}`
    };

    // Both socket channels emit to ensure frontend compatibility
    io.to(roomId).emit("receive_file", filePayload);
    io.to(roomId).emit("file-received", filePayload);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({ error: "Server upload failure" });
  }
});